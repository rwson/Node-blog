var mongodb = require('./db');

/**
 * user类
 * @param {[type]} user [description]
 */
function User(user) {
    this.name = user.name;
    this.password = user.password;
    this.email = user.email;
}

/**
 * 存储用户信息
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
User.prototype.save = function (callback) {
    var user = {
        name: this.name,
        password: this.password,
        email: this.password
    };

    //	打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
            //	如果连接失败,返回失败
        }

        db.collection('users', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
                //	错误就返回错误信息
            }

            collection.insert(user, {
                safe: true
            }, function (err, user) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, user["ops"]);
            });

        });

    });

};

/**
 * 注册时判断用户名是否存在
 * @param  {[type]}   name     [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
User.get = function (name, callback) {

    mongodb.open(function (err, db) {
    //  打开数据库
    
        if (err) {
            return callback(err);
        }//	错误返回错误信息

        db.collection('users', function (err, collection) {
        //  读取users表    

            if (err) {
                mongodb.close();
                return callback(err);
                //	错误就返回错误信息
            }

            collection.findOne({
                name: name
            }, function (err, user) {
            //  根据用户名查表    

                mongodb.close();
                if (err) {
                    return callback(err);
                }
                //  查询失败

                callback(null, user);

            });

        });

    });

};

module.exports = User;