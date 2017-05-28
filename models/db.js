//这个模块里面封装了所有对数据库的常用操作
var MongoClient = require('mongodb').MongoClient;
var settings = require('./setting');
//不管数据库的什么操作，都是先连接数据库，所以我们可以把链接数据库
//封装成内部函数
function _connectDB(callback) {
    var url = settings.dburl; //从setting文件中，读取数据库地址
    //链接书数据库

    MongoClient.connect(url, function (err, db) {
        if (err) {
            callback(err, null);
            return;
        }
        callback(err, db)
    });
}

init();
function init(){
    //对数据库进行一个初始化
    _connectDB(function(err,db){
        if(err){
            console.log(err);
            return;
        }
        db.collection('users').createIndex(
            {"username":1},
            null,
            function(err,result){
                if(err){
                    console.log(err);
                    return;
                }
                console.log('索引建立成功')
            }
            
        )
    })
}

exports.insertOne = function (collectionName, json, callback) {
    _connectDB(function (err, db) {
        db.collection(collectionName).insertOne(json, function (err, result) {
            callback(err, result);
            db.close();
        })
    })
}

//查找书库，找到所有数据.args是个对象{"pageamount":10,"page":10}
exports.find = function (collectionName, json, c, d) {
    var result = [];
    if (arguments.length == 3) {
        //那么参数C就是callback,参数d没有传。
        var callback = c;
        var skipnumber = 0;
        var limit = 0;
    } else if (arguments.length == 4) {
        var callback = d;
        var args = c;
        //应该省略的条数
        var skipnumber = args.pageamount * args.page || 0;
        //数目限制
        var limit = args.pageamount || 0;
        //排序
        var sort = args.sort || {};
    } else{
        throw new Error('find函数的参数个数，是3个，或者4个');
        
    }

    //连接数据库，连接之后查找所有的
    _connectDB(function (err, db) {
        var cursor = db.collection(collectionName).find(json).skip(skipnumber).limit(limit).sort(sort);
        cursor.each(function (err, doc) {
            if (err) {
                callback(err, null);
                 db.close();
                return;
            }

            if (doc != null) {
                result.push(doc); //放入结果数组
            } else {
                //遍历结束，没有更多的文档了
                callback(null, result);
                db.close();
            }
        })
    })
}

//删除
exports.deleteMany = function(collectionName,json,callback){
    _connectDB(function(err,db){
        db.collection(collectionName).deleteMany(
            json,
            function(err,result){    
                callback(err,result);
                db.close();
            }
        )
    })
}

//修改
exports.updateMany = function(collectionName,json1,json2,callback){
    _connectDB(function(err,db){
        db.collection(collectionName).updateMany(
            json1,
            json2,
            function(err,result){
                callback(err,result);
                db.close();
            })
    })
}


exports.getAllCount = function (collectionName,callback) {
    _connectDB(function (err, db) {
        db.collection(collectionName).count({}).then(function(count) {
            callback(count);
            db.close();
        });
    })
}