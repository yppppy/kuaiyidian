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
      
	 // console.log(ctx.request.body.email);
	 // console.log(ctx.request.body.pwd);
	 // ctx.body="hello";
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


router.post('/mobileLogin', async function (ctx, next) {
      console.log("HHHHHHHHHHHHH");
      let rs = await shopUser.findOne({where:{email:ctx.request.body.email,pwd:ctx.request.body.pwd}});
      console.log(rs);
       if(rs){
    
     let sql = 'select shopname from shops where id=?';
      let shopRs = await sequelize.query(sql,{replacements: [rs.shopid]});
          if(shopRs){
            console.log(shopRs);
          let loginbean = new Object();
        loginbean.id = rs.id;
       loginbean.nicheng = rs.nicheng;
      loginbean.shoprole = rs.role;
      loginbean.shopid = rs.shopid;
      loginbean.shopname = shopRs[0][0].shopname;
      ctx.session.loginbean=loginbean;
      ctx.body="1,"+loginbean.shopname+','+loginbean.shoprole;
   }
      }else{
          ctx.body=0;
      }
  
})





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
console.log("DDDDDDDDDD");
  if(typeof(loginbean.shoprole)!='undefined'&&loginbean.shoprole==0){
  	 
	 let rs = await ChildMenuModel.findAll({where:{typeid:ctx.query.id,shopid:loginbean.shopid}});
    console.log(rs);
    await ctx.render('shop/childmenu', {rs:rs,typeid:ctx.query.id});
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
       // fields.menusintro=fields.editorValue;
       fields.shopid=loginbean.shopid;
       fields.createtime=new Date();
        if(files.menusimg){//上传了图片
       fields.menusimg=files.menusimg.path.replace('public','');
     }else{//没上传，设置默认图
      fields.menusimg="/images/menu/aa.jpg"
     }
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
            console.log("ddddddddddddddddddddd");
            ctx.body=0;
             console.log("FFFFFFFFFFFF");
       // await  ctx.redirect("./lookMenu?id="+fields.typeid);//redirect不能传中文
           
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

router.get('/upStatus', async function (ctx, next) {
  let loginbean = ctx.session.loginbean;
console.log("DDDDDDDDDD");
  if(typeof(loginbean.shoprole)!='undefined'&&loginbean.shoprole==0){
     console.log(ctx.query.putaway);
   let rs = await ChildMenuModel.update({putaway:ctx.query.putaway},{where:{id:ctx.query.id,shopid:loginbean.shopid}});
    console.log(rs);
    if(rs[0]==1){//更新成功
    ctx.body=1;
      }else{
         ctx.body=0; 
      }
      
  }else{
    ctx.redirect('/');
  }
  
});




router.post('/updChildMenu', async (ctx, next) => {
  console.log("JJJJJJJJJJ");
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
     
       fields.shopid=loginbean.shopid;
       fields.createtime=new Date();

    if(files.menusimg){//更新了图片
      console.log("rrrrrrrrrrrrruuyluj.,y");
       fields.menusimg=files.menusimg.path.replace('public','');
     }
       
       resolve(fields);
      });
 });

     try{
      if(fields.menusimg!='undefined'){
          console.log("上传");
      let updrs = await ChildMenuModel.update(fields,{where:{'id':fields.dishid,shopid:fields.shopid}});
     
    }else{
      console.log("没上传");
      let sql="update  childmenus set menusname=?,currentprice=?  where id=? ";
   let updrs = await sequelize.query(sql,{replacements: [fields.menusname,fields.currentprice,fields.dishid],type: sequelize.QueryTypes.UPDATE});
      
    }
     ctx.body=0;
    }catch(err){
        console.log(err);
        ctx.body=1;
    }
  
        }else{
    ctx.redirect('/');
  }
      
        });    





router.get('/getMenu', async function (ctx, next) {
  let loginbean = ctx.session.loginbean;
  if((typeof(loginbean.shoprole)!='undefined')){
    console.log(loginbean.shopid);
      let menuRs = await MenuModel.findAll({where:{shopid:loginbean.shopid}});
     console.log(menuRs);
      let menuId = menuRs[0].id;
      let dishRs = await ChildMenuModel.findAll({where:{typeid:menuId}});
      ctx.body=[menuRs,dishRs];
    }
});


router.get('/logout', async function (ctx, next) {
  let loginbean = ctx.session.loginbean;
  
  delete ctx.session.loginbean;
  ctx.body=1;
})



module.exports = router