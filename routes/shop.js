const router = require('koa-router')()
var Users = require('../models/UserModel');
var shop = require('../models/ShopModel');
var formidable = require('formidable');
var sequelize =require('../models/ModelHeader')();
var shopUser = require('../models/ShopUserModel');
var MenuModel = require('../models/MenuModel');
var ChildMenuModel= require('../models/ChildMenuModel');
var formidable = require('formidable');
router.prefix('/shop');

router.get('/', async (ctx, next) => {

  await ctx.render('shop/addUser', {});
     
});



router.post('/login', async (ctx, next) => {
	
  let rs= await shopUser.findOne({where:{email:ctx.request.body.email,pwd:ctx.request.body.pwd}});
		console.log(rs);
		if(rs!=null){
		let  loginbean=new Object();
			loginbean.id = rs.id;
			loginbean.nicheng = rs.nicheng;
			loginbean.shopid = rs.shopid;
			loginbean.shoprole = rs.role;
		    ctx.session.loginbean=loginbean;
		    if(loginbean.shoprole==0){//
		  await 	ctx.render('shop/shopManager', {loginbean:loginbean});
          }else if(loginbean.shoprole==1){
             await  ctx.render('shop/shopwaiter', {loginbean:loginbean});
          }else if(loginbean.shoprole==2){

      }



				}else{
		
			ctx.body="email/密码错误！"
		}
	});







router.get('/checkAll', async (ctx, next) => {
       await ctx.render('shop/checkAll', {});
       
	});


router.post('/updateEmail', async (ctx, next) => {
	  let loginbean = ctx.session.loginbean;

  let rs= await shopUser.findOne({where:{id:loginbean.id}});
  console.log(rs);
  

  if (ctx.request.body.oldEmail==rs.email&&ctx.request.body.oldPwd==rs.pwd) {
 
  	try{
  		
      await  shopUser.update({email:ctx.request.body.newEmail},{where:{'id':loginbean.id}});
      
       ctx.body="更改成功！！！！";
  	}catch(err){
	
		if(err.errors[0].path=='emailuniq'){
			ctx.body='账号重复';
		}else{
			ctx.body = '数据库错误';
		}
		
		
   }
  }else{
  	 
  	  ctx.body="email或密码错误！！！！";
  }
		
	});



router.post('/addClerk', async function (ctx, next) {
	let loginbean = ctx.session.loginbean;
  	if((typeof(loginbean.shoprole)!='undefined')&&loginbean.shoprole==0){
		try{
			ctx.request.body.shopid=loginbean.shopid;
			let creaters = await shopUser.create(ctx.request.body);
			ctx.body='添加成功';
		}catch(err){
			if(err.errors[0].path=='emailuniq'){
				ctx.body='账号重复';
			}else{
				ctx.body = '数据库错误';
			}
		}
	}else{
		ctx.redirect('/');
	}
	
});

router.get('/lookClerk', async function (ctx, next) {
  let loginbean = ctx.session.loginbean;
  if(typeof(loginbean.shoprole)!='undefined'&&loginbean.shoprole==0){
  	  ctx.state = {
	    loginbean: loginbean,
	  };
	  let rs = await shopUser.findAll({where:{shopid:loginbean.shopid}});
	  await ctx.render('shop/lookClerk', {rs:rs});
  }else{
  	ctx.redirect('/');
  }
  
});

router.get('/menu', async function (ctx, next) {
	let loginbean = ctx.session.loginbean;
	ctx.state = {
	    loginbean: loginbean,
	  };
  	if((typeof(loginbean.shoprole)!='undefined')&&loginbean.shoprole==0){
  		let rs = await MenuModel.findAll({where:{shopid:loginbean.shopid}});
  		await ctx.render('shop/menu', {rs:rs});
  	}
});


router.post('/addMenu', async function (ctx, next) {
	let loginbean = ctx.session.loginbean;
	ctx.state = {
	    loginbean: loginbean,
	  };
  	if((typeof(loginbean.shoprole)!='undefined')&&loginbean.shoprole==0){
  		ctx.request.body.shopid=loginbean.shopid;
  		let creaters = await MenuModel.create(ctx.request.body);

  		ctx.redirect('./menu');
  	}
});


router.get('/lookMenu', async function (ctx, next) {
  let loginbean = ctx.session.loginbean;
  if(typeof(loginbean.shoprole)!='undefined'&&loginbean.shoprole==0){
  	  let sql="select * from childmenus as c,menus as m  where c.shopid=? and m.id=?";
	  let rs = await sequelize.query(sql,{replacements: [loginbean.shopid,ctx.query.id],type: sequelize.QueryTypes.QUERY});
	  await ctx.render('shop/childmenu', {rs:rs[0],typename:ctx.query.name,typeid:ctx.query.id});
  }else{
  	ctx.redirect('/');
  }
  
});




router.post('/addChildMenu', async (ctx, next) => {
  let loginbean = ctx.session.loginbean;
	
  	if((typeof(loginbean.shoprole)!='undefined')&&loginbean.shoprole==0){
	var form = new formidable.IncomingForm();   //创建上传表单 
    form.encoding = 'utf-8';        //设置编辑 
    form.uploadDir = './public/images/menu/';     //设置上传目录 文件会自动保存在这里 
    form.keepExtensions = true;     //保留后缀 
    form.maxFieldsSize = 5 * 1024 * 1024 ;   //文件大小5M 
    let fields=await new Promise(function (resolve,reject){
    form.parse(ctx.req, function (err, fields, files) { 
        if(err){ 
            console.log(err); 
            return;
        } 
        fields.menusintro=fields.editorValue;
       fields.shopid=loginbean.shopid;
       fields.menusimg=files.menusimg.path.replace('public','');
       fields.createtime=new Date();
       resolve(fields);
      });
 });

    //----------事物处理-----------------------
  let t = await sequelize.transaction();
  try{
      console.log("ssssssssssssss");
     await ChildMenuModel.create(fields, {transaction: t});
          
    await   MenuModel.update({num:sequelize.literal('num+1')},{where:{'shopid':loginbean.shopid,id:fields.typeid}},{transaction:t});
    
           await  t.commit();
             
        await  ctx.redirect("./lookMenu?id="+fields.typeid);//redirect不能传中文

   }catch(err){
    console.log(err);
    t.rollback();
     if(err.errors[0].path=='shopmenuuniq'){
      ctx.body='食品重复';
     }else{
       ctx.body = '数据库错误';
    }
    
   
   }

   }else{
  	ctx.redirect('/');
  }
      
        });    


module.exports = router