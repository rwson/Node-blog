var mongodb = require('./db');

var markdown = require('markdown').markdown;
//	引入markdown模块

/**
 * Post类
 * @param {[type]} name  [description]
 * @param {[type]} title [description]
 * @param {[type]} post  [description]
 */
function Post(name, title, post) {
    this.name = name;
    this.title = title;
    this.post = post;
}

/**
 * 存储文章的相关信息
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
Post.prototype.save = function (callback) {
    var date = new Date(),
        year = date.getFullYear(),
        month = date.getMonth() + 1 < 9 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1),
        day = date.getDate() < 9 ? "0" + date.getDate() : date.getDate(),
        hour = date.getHours(),
        minute = date.getMinutes() < 9 ? "0" + date.getMinutes() : date.getMinutes(),

        time = {
            'date': date,
            'year': year,
            'month': year + "-" + month,
            'day': year + "-" + month + "-" + day,
            'minutes': year + "-" + month + "-" + day + " " + hour + ":" + minute
        },
    //	存储各种时间格式

        post = {
            'name': this.name,
            'time': time,
            'title': this.title,
            'post': this.post,
            'comments':[]
        };
    //	要存储的文档格式

    mongodb.open(function (err, db) {
        //	打开数据库

        if (err) {
            return callback(err);
        }
        //	打开失败

        db.collection('posts', function (err, collection) {
            //	读取posts集合

            if (err) {
                mongodb.close();
                return callback(err);
            }

            collection.insert(post, {
                'safe': true
            }, function (err) {
                //	插入数据

                mongodb.close();

                if (err) {
                    return callback(err);
                }
                //	插入失败,返回err

                callback(null);

            });

        });

    });
};


/**
 * 读取所有文章及相关信息
 * @param  {[type]}   name     [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
Post.getAll = function (name, callback) {

    mongodb.open(function (err, db) {

        //	打开数据库
        if (err) {
            return callback(err);
        }

        db.collection('posts', function (err, collection) {
            //	读取posts集合

            if (err) {
                mongodb.close();
                return callback(err);
            }

            var query = {};

            if (name) {
                query.name = name;
            }

            collection.find(query).sort({
                'time': -1
            }).toArray(function (err, docs) {
                //	根据query查询文章

                mongodb.close();
                if (err) {
                    return callback(err);
                }
                //	读取失败,返回err

                docs.forEach(function (doc, index) {
                    doc.post = markdown.toHTML(doc.post);
                });
                //	添加markdown模块

                callback(null, docs);
                //	读取成功,用数组形式返回查询结果

            });

        });

    });
};

/**
 * 分页实现,一次获取10篇文章
 * @param  {[type]}   name     [description]
 * @param  {[type]}   page     [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
Post.getTen = function (name,page,callback){
    mongodb.open(function(err,db){
        //  打开数据库

        if(err){
            return callback(err);
        }
        //  打开失败

        db.collection('posts',function(err,collection){
            //  查询posts表

            if(err){
                mongodb.close();
                return callback(err);
            }
            //  查询失败

            var query ={};

            if(name){
                query.name =name;
            }

            collection.count(query,function(err,total){
                //  count查询,返回特定的文档数total

                collection.find(query,{
                    'skip':(page - 1) * 10,
                    'limit':10
                }).sort({
                    'time':-1
                }).toArray(function(err,docs){
                    //  跳过前几页的多少个10条,查询本页的10条,并且按时间降序排序

                    mongodb.close();
                    if(err){
                        return callback(err);
                    }
                    //  查询失败

                    docs.forEach(function(doc){
                        doc.post = markdown.toHTML(doc.post);
                    });

                    callback(null,docs,total);
                });

            });

        });

    });
};

/**
 * 获取一篇文章
 * @param  {[type]}   name     [description]
 * @param  {[type]}   day      [description]
 * @param  {[type]}   title    [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
Post.getOne = function (name, day, title, callback) {
    mongodb.open(function (err, db) {
        //	打开数据库

        if (err) {
            return callback(err);
        }
        //	数据库打开失败

        db.collection('posts', function (err, collection) {
            //	读取posts集合

            if (err) {
                mongodb.close();
                return callbacl(err);
            }
            //	读取失败

            collection.findOne({
                'name': name,
                'title': title,
                'time.day': day
            }, function (err, doc) {
                //	根据用户名、发表日期及文章名进行

                mongodb.close();
                if (err) {
                    return callback(err);
                }
                //	读取失败

                if(doc){
					doc.post = markdown.toHTML(doc.post);
					doc.comments.forEach(function(comment){
                        //  循环评论
                        
                        if(comment.content){
                            comment.content = markdown.toHTML(comment.content);        
                        }
                        //  评论内容存在,用markdown转成HTML格式

					});
                }
                //	解析markdown为html

                callback(null, doc);
                //	返回查到的文章

            });
        });
    });
};

/**
 * 返回之前发表或者最后一次编辑提交的内容
 * @param  {[type]}   name     [description]
 * @param  {[type]}   day      [description]
 * @param  {[type]}   title    [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
Post.edit = function (name, day, title, callback) {
    mongodb.open(function (err, db) {
        //	打开数据库

        if (err) {
            return callback(err);
        }
        //	打开失败

        db.collection('posts', function (err, collection) {
            //	读取posts表

            if (err) {
                mongodb.close();
                return callback(err);
            }
            //	读取失败

            collection.findOne({
                'name': name,
                'time.day': day,
                'title': title
            }, function (err, doc) {

                mongodb.close();
                if (err) {
                    return callback(err);
                }
                //	读取失败

                callback(null, doc);
                //	把查询到数据返回给回调函数
            });

        });

    });
};

/**
 * 把文章更新到数据库
 * @param  {[type]}   name     [description]
 * @param  {[type]}   day      [description]
 * @param  {[type]}   title    [description]
 * @param  {[type]}   post     [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
Post.update = function (name, day, title, post, callback) {
    mongodb.open(function (err, db) {
        //	打开数据库

        if (err) {
            return callback(err);
        }
        //	打开失败,并且返回错误信息

        db.collection('posts', function (err, collection) {
            //	读取posts表

            if (err) {
                mongodb.close();
                return callback(err);
            }
            //	读取失败

            collection.update({
                'title': title,
                'name': name,
                'time.day': day
            }, {
                $set: {
                    'post': post
                }
            }, function (err) {
                //	更新对应的文章

                if (err) {
                    return callback(err);
                }
                //	更新失败

                callback(null);
            });

        });

    });
};

/**
 * 从数据库中删除一篇文章
 * @param  {[type]}   name     [description]
 * @param  {[type]}   day      [description]
 * @param  {[type]}   title    [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
Post.remove = function (name, day, title, callback) {
    mongodb.open(function (err, db) {
        //	打开数据库

        if (err) {
            return callback(err);
        }
        //	打开失败

        db.collection('posts', function (err, collection) {
            //	读取posts表

            if (err) {
                mongodb.close();
                return callback(err);
            }
            //	读取失败

            collection.remove({
                'name': name,
                'time.day': day,
                'title': title
            }, {
                'w': 1
            }, function (err) {
                //	根据用户名,日期,标题删除一篇文章

                mongodb.close();

                if (err) {
                    return callback(err);
                }
                //	删除失败

                callback(null);
                //	删除成功
            });
        });
    });
};



module.exports = Post;