'use strict';
var express = require('express');
var timeout = require('connect-timeout');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var AV = require('leanengine');
var router = require('./routes/router');
//使用session
var session = require('express-session');
var app = express();


app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
}))
// 加载云函数定义，你可以将云函数拆分到多个文件方便管理，但需要在主文件中加载它们
require('./cloud');



// 设置模板引擎
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static('public'));

// 设置默认超时时间
app.use(timeout('15s'));

// 加载云引擎中间件
app.use(AV.express());

app.enable('trust proxy');
// 需要重定向到 HTTPS 可去除下一行的注释。
// app.use(AV.Cloud.HttpsRedirect());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());



// 可以将一类的路由单独保存在一个文件中
app.use('/avatar',express.static('./avatar'))

app.get('/',router.showIndex);
app.get('/regist',router.showRegist);
app.get('/logout',router.logout)
app.post('/doregist',router.doRegist);
app.get('/login',router.showLogin);
app.post('/dologin',router.doLogin);              //登录
app.get('/setavatar',router.showSetAvatar);       //显示头像页面
app.post('/dosetavatar',router.doSetAvatar);      //执行设置头像
app.get('/cut',router.showCut)                    //剪裁头像页面
app.get("/docut",router.doCut);                   //执行建材
app.get('/getallshuoshuo',router.getAllShuoshuo) //列出说有说说
app.post('/dodist',router.doDist);
app.get('/getuserinfo',router.getUserInfo)
app.get('/getallcount',router.getAllCount)
app.get('/user/:username',router.showUser)
app.get('/user',router.showUser)
app.get('/userslist',router.usersList)



// error handlers


module.exports = app;
