var crypto = require('crypto'),
    User = require('../modles/user.js'),
    Post = require('../modles/post.js'),
    fs = require('fs');

module.exports = function (app) {

    app.get('/', function (req, res) {
        Post.getAll(null, function (err, posts) {
            //	从数据库中读取所有信息

            res.render('index', {
                'title': '主页',
                'user': req.session.user,
                'posts': posts,
                'success': req.flash('success').toString(),
                'error': req.flash('error').toString()
            });
        });
    });
    //	首页请求

    app.get('/reg', _checkNotLogin);
    //	验证是否登录
    app.get('/reg', function (req, res) {
        res.render('reg', {
            'title': '注册',
            'user': req.session.user,
            'success': req.flash('success').toString(),
            'error': req.flash('error').toString()
        });
    });
    //	跳转到注册页

    app.post('/reg', _checkNotLogin);
    //	验证是否登录
    app.post('/reg', function (req, res) {

        var name = req.body.name,
            password = req.body.password,
            passwordRe = req.body["password-repeat"];

        if (password != passwordRe) {
            req.flash('error', '两次密码不一样!');
            return res.redirect('/reg');
        }
        //	密码不一样,重定向到注册页

        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('hex');

        var newUser = new User({
            name: req.body.name,
            password: password,
            email: req.body.email
        });

        User.get(newUser.name, function (err, user) {

            if (user) {
                req.flash('error', '用户已经存在!');
                return res.redirect('/reg');
            }
            //	用户名已经存在

            newUser.save(function (err, user) {

                if (err) {
                    req.flash('error', err);
                    return res.redirect('/reg');
                }

                req.session.user = user;
                //	写入session

                req.flash('success', '注册成功!');
                return res.redirect('/');

            });

        });
    });
    //	注册请求

    app.get('/login', _checkNotLogin);
    app.get('/login', function (req, res) {
        res.render('login', {
            'title': '登录',
            'user': req.session.user,
            'success': req.flash('success').toString(),
            'error': req.flash('error').toString()
        });
    });
    //	登录页

    app.post('/login', _checkNotLogin);
    app.post('/login', function (req, res) {

        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('hex');

        User.get(req.body.name, function (err, user) {
            if (!user) {
                req.flash('error', '用户不存在！');
                return res.redirect('/login');
            }

            //	用户不存在的情况
            if (user.password != password) {
                req.flash('error', '密码错误！');
                return res.redirect('/login');
            }
            //	密码错误
            req.session.user = user;
            req.flash('success', '登陆成功');
            res.redirect('/');
        });
    });
    //	登录请求

    app.get('/post', _checkLogin);
    app.get('/post', function (req, res) {
        res.render('post', {
            'title': '发表',
            'user': req.session.user,
            'success': req.flash('success').toString(),
            'error': req.flash('error').toString()
        });
    });
    //	跳转到发表页

    app.post('/post', _checkLogin);
    app.post('/post', function (req, res) {
        //	发表按钮点击

        var currentUser = req.session.user[0],
            post = new Post(currentUser.name, req.body.title, req.body.content);
        //	实例化post对象

        post.save(function (err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            //	保存失败

            req.flash('success', '发表成功!');
            res.redirect('/');
        });
    });
    //	发表请求

    app.get('/upload', _checkLogin);
    app.get('/upload', function (req, res) {
        res.render('upload', {
            'title': '文件上传',
            'user': req.session.user,
            'success': req.flash('success').toString(),
            'error': req.flash('error').toString()
        });
    });
    //	跳转到文件上传页

    app.post('/upload', _checkLogin);
    app.post('/upload', function (req, res) {
        for (var i in req.files) {
            //	遍历上传的文件序列

            var curFile = req.files[i];
            //	获取当前文件

            if (curFile.size == 0) {
                fs.unlinkSync(curFile.path);
            }
            //	同步方法删除一个文件
            else {
                var tPath = './public/upload/' + curFile.name;
                fs.renameSync(curFile.path, tPath);
            }

            return res.redirect('/upload');
            //	文件上传完成,重定向到上传页面
        }
    });
    //	上传文件

    app.get('/u/:name', function (req, res) {
        //	检测用户名是否存在

        User.get(req.params.name, function (err, user) {
            if (!user) {
                req.flash('error', '用户不存在！');
                return res.redirect('/');
            }
            //	用户不存在

            Post.getAll(user.name, function (err, posts) {
                //	查询

                if (err) {
                    req.flash('error', err);
                    return res.redirect('/');
                }
                //	查询失败

                res.render('user', {
                    'title': user.name,
                    'posts': posts,
                    'user': req.session.user,
                    'success': req.flash('success').toString(),
                    'error': req.flash('error').toString()
                });
                //	渲染user页面

            });

        });
    });
    //	用户详情请求

    app.get('/u/:name/:day/:title', function (req, res) {
        Post.getOne(req.params.name, req.params.day, req.params.title, function (err, post) {
            //	从数据库查询一条记录

            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            //	查询失败

            res.render('article', {
                'title': req.params.title,
                'post': post,
                'user': req.session.user && req.session.user[0],
                'success': req.flash('success').toString(),
                'error': req.flash('error').toString()
            });
            //	渲染文章页面

        });
    });
    //	文章详细请求

    app.get('/edit/:name/:day/:title', _checkLogin);
    app.get('/edit/:name/:day/:title', function (req, res) {
        var curUser = req.session.user[0];

        Post.edit(curUser.name, req.params.day, req.params.title, function (err, post) {
            //	取得之前发布或编辑过的文章

            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            //	查询失败,返回错误信息并返回到之前页面

            res.render('edit', {
                'title': '编辑',
                'post': post,
                'user': curUser,
                'success': req.flash('success').toString(),
                'error': req.flash('error').toString()
            });

        });
    });
    //	编辑文章

    app.post('/edit/:name/:day/:title', _checkLogin);
    app.post('/edit/:name/:day/:title', function (req, res) {

        var opt = [
                {
                    "encode": true,
                    "param": req.params.name
                },
                {
                    "param": req.params.day
                },
                {
                    "encode": true,
                    "param": req.params.title
                }
            ],
            url = '/u/' + _encodeUrl(opt);
        //	拼接html,保存成功/失败后跳转

        var curUser = req.session.user[0];
        Post.update(curUser.name, req.params.day, req.params.title, req.body.content, function (err) {
            if (err) {
                req.flash('error', err);
                return res.redirect(url);
            }
            //	保存失败,返回之前的文章页


            console.log("保存成功!");
            req.flash('success', '保存成功!');
            res.redirect(url);
            //	修改成功,返回之前的文章页

        });
    });
    //	修改文章

    app.get('/remove/:name/:day/:title', _checkLogin);
    app.get('/remove/:name/:day/:title', function (req, res) {
        var curUser = req.session.user[0];
        Post.remove(curUser.name, req.params.day, req.params.title, function (err) {
            //	删除数据库里的记录

            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            //	删除失败

            req.flash('success', '删除成功!');
            res.redirect('/');

        });
    });
    //	删除文章的请求

    app.get('logout', _checkLogin);
    app.get('/logout', function (req, res) {
        req.session.user = null;
        req.flash('success', '退出成功');
        res.redirect('/');
    });
    //	登出请求

}

/**
 * 如果未登录,返回登录页
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
function _checkLogin(req, res, next) {
    if (!req.session.user) {
        req.flash('error', '未登录！')
        res.redirect('/login');
    }
    next();
}

/**
 * 如果已经登录,返回之前页
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
function _checkNotLogin(req, res, next) {
    if (req.session.user) {
        req.flash('error', '已登录！')
        res.redirect('back');
    }
    next();
}

/**
 * url先加密,防止出现url中文无法被正确解析的情况
 * @param  {[type]} data [description]
 * @return {[type]}      [description]
 */
function _encodeUrl(data) {
    var arr = [];
    data.forEach(function (item, index, array) {
        console.log(item);
        arr.push(item["encode"] ? encodeURIComponent(item["param"]) : item["param"]);
        //	如果encode参数为true,就是需要编码,否则就不需要编码
    });
    return arr.join("/");
}
