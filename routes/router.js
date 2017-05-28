
var formidable = require('formidable')
var db = require('../models/db')
var md5 = require('../models/md5')
var fs = require('fs');
var gm = require('gm');
var AV = require('leanengine');
var Posts = AV.Object.extend('Posts');
var Avatar = AV.Object.extend('Avatar');




exports.showIndex = function (req, res) {
    var loginData;
    var avatar;
    if (req.session.login === '1') {
        var query = new AV.Query('Avatar');
        query.equalTo('username', req.session.username)
        query.find().then(function (result) {
            loginData = {
                isLogin: true,
                avatar: result[0].attributes.avatar, //登录人的头像
                user: {
                    username: req.session.username
                },
            }
            res.render('index', loginData);
        })
        // db.find('users', { username: req.session.username }, function (err, result) {
        //     avatar = result[0].avatar || "moren.jpg";
        //     db.find('posts', {}, { sort: { "datatime": -1 } }, function (err, result2) {
        //         if (err) {
        //             console.log(err);
        //             return;
        //         }
        //         loginData = {
        //             isLogin: true,
        //             avatar: avatar, //登录人的头像
        //             user: {
        //                 username: req.session.username
        //             },
        //         }
        //         res.render('index', loginData);
        //     })
        // })
    } else {
        loginData = {
            isLogin: false,
            avatar: "moren.jpg",
            user: {
                username: ""
            }
        }
        res.render('index', loginData);
    }
}


//注册页面
exports.showRegist = function (req, res) {
    var loginData
    if (req.session.login == "1") {
        loginData = {
            isLogin: true,
            active: "注册",
            user: {
                username: req.session.username
            }
        }
    } else {
        loginData = {
            isLogin: false
        }
    }
    res.render('regist', loginData);
}

//注册业务
exports.doRegist = function (req, res) {
    //得到用户填写的东西
    //查询数据库中是不是有这个人
    //保存这个人
    var username = req.body.username;
    var mingma = req.body.password;
    //加密
    var password = md5(md5(mingma) + 'Clark')

    //把用户名和密码存入数据库
    var user = new AV.User();
    user.setUsername(username);
    user.setPassword(password);
    user.signUp().then((loginedUser) => {
        req.session.login = '1',
            req.session.username = username;
        req.session.id = loginedUser.id;
        var avatar = new Avatar();
        avatar.set("username", username);
        avatar.set('myid', loginedUser.id);
        avatar.set('avatar', 'moren.jpg');
        avatar.save();


        res.send('1')
    }, (error) => {
        res.send(error)
    })
}

//登出
exports.logout = function (req, res) {
    req.session.destroy()
    res.redirect('/')
}

//登录页面
exports.showLogin = function (req, res) {
    var loginData
    if (req.session.login == "1") {
        loginData = {
            isLogin: true,
            active: "登录",
            user: {
                username: req.session.username
            }
        }
    } else {
        loginData = {
            isLogin: false
        }
    }
    res.render('login', loginData)
}

//执行登录
exports.doLogin = function (req, res) {
    var username = req.body.username;
    var mingma = req.body.password;
    var password = md5(md5(mingma) + 'Clark')

    AV.User.logIn(username, password).then(function (loginedUser) {
        req.session.login = '1';
        req.session.username = username;
        req.session.id = loginedUser.id;
        res.send('1');
    }, function (error) {
        res.send(error)
    });
    // db.find('users', { "username": username }, function (err, result) {
    //     if (err) {
    //         res.send('-3');
    //         return;//服务器错误
    //     };
    //     if (result.length == 0) {
    //         res.send("-1");//用户名不存在
    //         return;
    //     }
    //     var dbPassword = result[0].password;
    //     if (dbPassword !== password) {
    //         res.send("-2");//密码错误
    //         return;
    //     } else {
    //         req.session.login = '1';
    //         req.session.username = username;
    //         res.send('1');
    //     }
    // })
}


exports.showSetAvatar = function (req, res) {
    if (req.session.login != "1") {
        res.send('非法闯入，这个页面要求登录');
        return;
    }
    res.render('setavatar', {
        isLogin: true,
        user: {
            username: req.session.username
        }
    });
}

exports.doSetAvatar = function (req, res) {
    var form = new formidable.IncomingForm();
    form.uploadDir = './avatar';
    form.parse(req, function (err, fields, files) {
        var oldPath = files.headPortrait.path;
        var newPath = './avatar/' + req.session.username + ".jpg"
        fs.rename(oldPath, newPath, function (err) {
            if (err) {
                res.send('失败');
                return;
            }
            req.session.avatar = req.session.username + '.jpg';
            res.redirect('/cut');
        })
    })
}

exports.showCut = function (req, res) {
    if (req.session.login != "1") {
        res.send('非法闯入，这个页面要求登录');
        return;
    }
    res.render('cut', {
        avatar: req.session.avatar
    })
}

exports.doCut = function (req, res, next) {
    //这个页面接收几个GET请求参数
    //文件名、w、h、x、y
    var filename = req.session.avatar;
    var w = req.query.w;
    var h = req.query.h;
    var x = req.query.x;
    var y = req.query.y;

    gm("./avatar/" + filename)
        .crop(w, h, x, y)
        .resize(100, 100, "!")
        .write("./avatar/" + filename, function (err) {
            if (err) {
                res.send("-1");
                return;
            }
            //更改数据库当前用户的avatar这个值
            var queryAvatar = new AV.Query('Avatar')
            queryAvatar.equalTo('username', req.session.username);
            queryAvatar.find().then(function (ret) {
                var updata = AV.Object.createWithoutData('Avatar', ret[0].id);
                updata.set('avatar', req.session.avatar);
                updata.save().then(function () {
                    res.send('1');
                });
            })
        });
}


//发表说说
exports.doDist = function (req, res) {
    if (req.session.login != "1") {
        res.send('非法闯入，这个页面要求登录');
        return;
    }
    var content = req.body.content;
    var posts = new Posts();
    posts.set('username', req.session.username)
    posts.set('datatime', new Date().toLocaleString())
    posts.set('content', content)
    posts.save().then(function (ret) {
        res.send('1')
    }, function (err) {
        res.send('-3')
    })
}

//列出说有说说
exports.getAllShuoshuo = function (req, res) {
    var page = req.query.page;
    var query = new AV.Query('Posts')
    query.limit(10)
    query.skip(page * 10)
    query.descending('createdAt');
    query.find().then((posts) => {
        res.json(posts)
    })




}

exports.getUserInfo = function (req, res) {
    var username = req.query.username;
    var queryAvatar = new AV.Query('Avatar')
    queryAvatar.equalTo('username', username);
    queryAvatar.find().then(function (ret) {
        // console.log(ret);
        var obj = {
            "username": ret[0].attributes.username,
            'avatar': ret[0].attributes.avatar,
        }
        res.json(obj)
    })
}


exports.getAllCount = function (req, res) {
    var query = new AV.Query('Posts')
    query.find().then(function (ret) {
        var count = ret.length;
        res.send(count.toString())
    })
}

exports.showUser = function (req, res) {
    var username = req.params.username;
    var queryPost = new AV.Query('Posts');
    queryPost.equalTo('username', username);
    queryPost.descending('createdAt');
    queryPost.find().then(function (ret) {
        var queryAvatar = new AV.Query('Avatar')
        queryAvatar.equalTo('username', username);
        queryAvatar.find().then(function (ret1) {
            if (req.session.login == "1") {
                res.render('user', {
                    users: username,
                    isLogin: true,
                    myshuoshuo: ret,
                    mypic: ret1[0].attributes.avatar,
                    user: {
                        username: req.session.username
                    }
                })
            } else {
                res.render('login', {
                    isLogin: false
                })
            }
        })
    })
}

exports.usersList = function (req, res) {
    var queryUser = new AV.Query('_User')
    var avatarArr = [];
    queryUser.find().then(function (ret) {
        iterator(0)
        function iterator(n) { 
            if (n === ret.length) {
                if (req.session.login == "1") {
                    res.render('userslist', {
                        isLogin: true,
                        userslist: ret,
                        avatar: avatarArr,
                        user: {
                            username: req.session.username
                        }
                    })       
                } else {
                    res.render('login', { isLogin: false })
                }
                return;
            }
            var queryAvatar = new AV.Query('Avatar')
            queryAvatar.equalTo('username', ret[n].attributes.username)
            queryAvatar.find().then(function (ret1) {
                avatarArr.push(ret1[0].attributes.avatar);
                iterator(n + 1)
            })
        }
    })
}