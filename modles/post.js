var mongodb = require('./db');

var markdown = require('markdown').markdown;
//	引入markdown模块

/**
 * Post类
 * @param {[type]} name  [description]
 * @param {[type]} title [description]
 * @param {[type]} post  [description]
 */
function Post(name,title,post){
	this.name = name;
	this.title = title;
	this.post = post;
}

/**
 * 存储文章的相关信息
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
Post.prototype.save = function(callback){
	var date = new Date(),
		year = date.getFullYear(),
		month = date.getMonth() + 1 < 9 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1),
		day = date.getDate() < 9 ? "0" + date.getDate() : date.getDate(),
		hour = date.getHours(),
		minute = date.getMinutes() < 9 ? "0" + date.getMinutes() : date.getMinutes(),

		time = {
			'date':date,
			'year':year,
			'month':year + "-" + month,
			'day':year + "-" + month + "-" + day,
			'minutes':year + "-" + month + "-" + day + " " + hour + ":" + minute
		},
		//	存储各种时间格式

		post = {
			'name':this.name,
			'time':time,
			'title':this.title,
			'post':this.post
		};
		//	要存储的文档格式

		mongodb.open(function(err,db){
			//	打开数据库

			if(err){
				return callback(err);
			}
			//	打开失败

			db.collection('posts',function(err,collection){
				//	读取posts集合

				if(err){
					mongodb.close();
					return callback(err);
				}

				collection.insert(post,{
					'safe':true
				},function(err){
					//	插入数据

					mongodb.close();

					if(err){
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
Post.getAll = function(name,callback){

	mongodb.open(function(err,db){

		//	打开数据库
		if(err){
			return callback(err);
		}

		db.collection('posts',function(err,collection){
			//	读取posts集合

			if(err){
				mongodb.close();
				return callback(err);
			}

			var query = {};

			if(name){
				query.name = name;
			}

			collection.find(query).sort({
				'time':-1
			}).toArray(function(err,docs){
				//	根据query查询文章

				mongodb.close();
				if(err){
					return callback(err);
				}
				//	读取失败,返回err

				docs.forEach(function(doc, index){
					doc.post = markdown.toHTML(doc.post);
				});
				//	添加markdown模块

				callback(null,docs);
				//	读取成功,用数组形式返回查询结果

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
Post.getOne = function(name,day,title,callback){
	mongodb.open(function(err,db){
		//	打开数据库
		
		if(err){
			return callback(err);
		}
		//	数据库打开失败

		db.collection('post',function(err,collection){
			//	读取posts集合

			if(err){
				mongodb.close();
				return callbacl(err);
			}
			//	读取失败
		
			collection.findOne({
				'name':name
			},function(err,doc){
				//	根据用户名、发表日期及文章名进行

				console.log("-------------------------------");
				console.log(name);
				console.log(day);
				console.log(title);
				console.log(doc);
				console.log("-------------------------------");

				mongodb.close();
				if(err){
					return callback(err);
				}
				//	读取失败

				doc.post = markdown.toHTML(doc.post);
				//	解析markdown为html

				callback(null,doc);
				//	返回查到的文章

			});
		});
	});
}

module.exports = Post;