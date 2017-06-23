const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')
var ueditor = require("ueditor");
const index = require('./routes/index')
const users = require('./routes/users')
const admin = require('./routes/admin')
const shop = require('./routes/shop')
var session = require('koa-generic-session');



// error handler
onerror(app)

// middlewares
app.use(bodyparser({
  enableTypes:['json', 'form', 'text']
}))
app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))

app.use(views(__dirname + '/views', {
  extension: 'ejs'
}))

// logger
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

//session
app.keys = ['my secret key'];
app.use(session());

// //使用模块  
// app.use("/ueditor/ue", ueditor(path.join(__dirname, 'public'), function (req, res, next) {  
//     // ueditor 客户发起上传图片请求  
//     if (req.query.action === 'uploadimage') {  
//         var foo = req.ueditor;  
  
//         var imgname = req.ueditor.filename;  
  
//         var img_url = '/images/ueditor/';  
//         res.ue_up(img_url); //你只要输入要保存的地址 。保存操作交给ueditor来做  
//         res.setHeader('Content-Type', 'text/html');//IE8下载需要设置返回头尾text/html 不然json返回文件会被直接下载打开  
//     }  
//     //  客户端发起图片列表请求  
//     else if (req.query.action === 'listimage') {  
//         var dir_url = '/images/ueditor/';  
//         res.ue_list(dir_url); // 客户端会列出 dir_url 目录下的所
// 有图片  
//     }  
//     // 客户端发起其它请求  
//     else {  
//         // console.log('config.json')  
//         res.setHeader('Content-Type', 'application/json');  
//         res.redirect('/ueditor/jsp/config.json');  
//     }  
// }));  

//-------------------------拦截器---------------------------------------
var openPage = ['/','/admin/login','/shop/login','/shop/mobileLogin'];
app.use(async (ctx, next) => { 
    var url = ctx.originalUrl;
    console.log('url='+url);
    url = (url.split('?'))[0];
    if(openPage.indexOf(url)>-1){
    	await next();
    }else{
    	if(ctx.session.loginbean){
	  		await next();
	  	}else{
	  		ctx.redirect('/');
	  	}
    }
});
// routes
app.use(index.routes(), index.allowedMethods())
app.use(users.routes(), users.allowedMethods())
app.use(admin.routes(), admin.allowedMethods())
app.use(shop.routes(), shop.allowedMethods())
module.exports = app
