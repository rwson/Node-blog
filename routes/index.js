var crypto = require('crypto'),
    User = require('../modles/user.js'),
    Post = require('../modles/post.js'),
    Comment = require('../modles/comment.js'),
    fs = require('fs');

module.exports = function (app) {

    app.get('/', function (req, res) {
        var page = req.query.p ? parseInt(req.query.p) : 1;
        //  判断是否为第一个,并且把请求的页码转换成数字类型

        Post.getTen(null, page, function (err, posts, total) {
            //  从数据库中获取当前页对应的10条数据
            
            if (err) {
                posts = [];
            }
            //  获取失败,把post置为空数组

            res.render('index', {
                'title': '主页',
                'user': req.session.user,
                'posts': posts,
                'page': page,
                'isFirstPage': page == 1,
                'isLastPage': ((page - 1) * 10 + posts.length) == total,
                'success': req.flash('success').toString(),
                'error': req.flash('error').toString()
            });
        });
    });
    //	首页

    app.get('/reg', _checkNotLogin);
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
    //	注册提交

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
    //	登录

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
        var currentUser = req.session.user,
            tags = [req.body.tag1,req.body.tag2,req.body.tag3],
        //  标签    
            post = new Post(currentUser.name, currentUser.head,req.body.title, tags,req.body.content);
        //  实例化post对象

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
    //	发表文章

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

    app.get('/archive',function(req,res){
        Post.getArchive(function(err,posts){
            //  从数据库中获取记录

            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            //  查询失败

            res.render('acrhive',{
                'title':'存档',
                'posts':posts,
                'user':req.session.user,
                'success':req.flash('success'),
                'error':req.flash('error')
            });
        });
    });
    //  存档

    app.get('/tags',function(req,res){
        Post.getTags(function(err,posts){
            //  从数据库获取对应标签的文章

            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            //  读取失败

            res.render('tags',{
                'title':'分类标签',
                'posts':posts,
                'user':req.session.user,
                'success':req.flash('success').toString(),
                'error':req.flash('error').toString()
            });

        });
    });
    //  所有标签

    app.get('/tags/:tag',function(req,res){
        Post.getTag(req.params.tag,function(err,posts){
            //  从数据库获取该标签对应的标签

            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            //  查询失败

            res.render('tag',{
                'title':req.params.tag,
                'posts':posts,
                'user':req.session.user,
                'success':req.flash('success').toString(),
                'error':req.flash('error').toString()
            });

        });
    });
    //  指定标签

    app.get('/search',function(req,res){
        Post.search(req.query.keyword,function(err,posts){
            //  从数据库中取得记录

            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            //  搜索失败

            res.render('search',{
                'title':req.query.keyword + "的搜索结果",
                'user':req.session.user,
                'posts':posts,
                'keyword':req.query.keyword,
                'success':req.flash('success').toString(),
                'error':req.flash('error').toString()
            });

        });
    });
    //  搜索

    app.get('/links',function(req,res){
        res.render('links',{
            'title':'友情链接',
            'user':req.session.user,
            'success':req.flash('success').toString(),
            'error':req.flash('error').toString()
        });
    });
    //  友情链接

    app.get('/u/:name', function (req, res) {
        var page = req.query.p ? parseInt(req.query.p) : 1;
        //  判断是否为第一页

        User.get(req.params.name, function (err, user) {
            //  检测用户名是否存在

            if (!user) {
                req.flash('error', '用户不存在！');
                return res.redirect('/');
            }
            //  用户不存在

            Post.getTen(user.name, page, function (err, posts, total) {
                //  查询

                if (err) {
                    req.flash('error', err);
                    return res.redirect('/');
                }
                //  查询失败

                res.render('user', {
                    'title': user.name,
                    'posts': posts,
                    'page': page,
                    'isFirstPage': page == 1,
                    'isLastPage': ((page - 1) * 10 + posts.length) == total,
                    'user': req.session.user,
                    'success': req.flash('success').toString(),
                    'error': req.flash('error').toString()
                });
                //  渲染user页面

            });

        });
    });
    //	用户详情

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
                'user': req.session.user,
                'success': req.flash('success').toString(),
                'error': req.flash('error').toString()
            });
            //	渲染文章页面

        });
    });
    //	文章详细

    app.post('/u/:name/:day/:title', function (req, res) {
        var date = new Date(),
            time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " "
                + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()),
            md5 = crypto.createHash('md5'),
            emailMd5 = md5.update(req.body.email.toLowerCase()).digest('hex'),
            head = 'http://zh-tw.gravatar.com/avatar' + emailMd5 + '?s=48',
            comment = {
                'name': req.body.name,
                'head':head,
                'email': req.body.email,
                'website': req.body.website,
                'time': time,
                'content': req.body.content
            },
            newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
        //  实例化一个评论对象

        newComment.save(function (err) {
            //  将评论入库

            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            //  评论失败

            req.flash('success', '留言成功!');
            res.redirect('back');
            //  评论成功

        });
    });
    //  评论请求

    app.get('/edit/:name/:day/:title', _checkLogin);
    app.get('/edit/:name/:day/:title', function (req, res) {
        var curUser = req.session.user;
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

        var curUser = req.session.user;
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
        var curUser = req.session.user;
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
    //	删除指定的文章

    app.get('/reprint/:name/:day/:title',_checkLogin);
    app.get('/reprint/:name/:day/:title',function(req,res){
        Post.edit(req.params.name,req.params.day,req.params.title,function(err,post){
            //  调用edit返回markdown格式的文本,而不是getOne返回的HTML字符串

            if(err){
                req.flash('error',err);
                return res.redirect('back');
            }
            //  查询失败

            var curUser = req.session.user,
                reprint_from = {
                    'name':post.name,
                    'day':post.time.day,
                    'title':post.title
                },
                reprint_to = {
                    'name':curUser.name,
                    'head':curUser.head
                },
            //  转载信息

                opt = [
                    {
                        "encode": true,
                        "param": post.name
                    },
                    {
                        "param": post.time.day
                    },
                    {
                        "encode": true,
                        "param": post.title
                    }
                ],
                url = '/u/' + _encodeUrl(opt);
                //  组装url,调用_encodeUrl解决中文无法解析问题

            Post.reprint(reprint_from,reprint_to,function(err,post){
                //  调用转载方法
                
                if(err){
                    req.flash('error',err);
                    return res.redirect('back');
                }
                //  转载失败,返回之前的页面

                req.flash('success','转载成功!');
                res.redirect(url);

            });

        });
    });
    //  转载请求

    app.get('logout', _checkLogin);
    app.get('/logout', function (req, res) {
        req.session.user = null;
        req.flash('success', '退出成功');
        res.redirect('/');
    });
    //	登出

    app.use(function(req,res){
        res.render('404');
    });
    //  404页

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
        req.flash('error', '已登录！');
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
        arr.push(item["encode"] ? encodeURIComponent(item["param"]) : item["param"]);
        //	如果encode参数为true,就是需要编码,否则就不需要编码
    });
    return arr.join("/");
}
