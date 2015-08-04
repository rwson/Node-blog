var mongodb = require('./db');

/**
 * user类
 * @param {[type]} user [description]
 */
function User(user){
	this.name = user.name;
	this.password = user.password;
	this.email = user.email;
}

/**
 * 存储用户信息
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
User.prototype.save = function(callback){
	var user = {
		name:this.name,
		password:this.password,
		email:this.password
	};

	//	打开数据库
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
			//	如果连接失败,返回失败
		}

		db.collection('users',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
				//	错误就返回错误信息
			}

			collection.insert(user,{
				safe:true
			},function(err,user){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null,user["ops"]);
			});

		});

	});

};


User.get = function(name,callback){

	//	打开数据库
	mongodb.open(function(err,db){

		if(err){
			return callback(err);
		}//	错误返回错误信息

		db.collection('users',function(err,collection){

			if(err){
				mongodb.close();
				return callback(err);
				//	错误就返回错误信息
			}

			collection.findOne({
				name:name
			},function(err,user){

				mongodb.close();

				if(err){
					return callback(err);
				}

				callback(null,user);

			});

		});

	});

};

module.exports = User;