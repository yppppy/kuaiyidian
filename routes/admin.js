const router = require('koa-router')()
var Users = require('../models/UserModel');
var shop = require('../models/ShopModel');
var formidable = require('formidable');
var sequelize =require('../models/ModelHeader')();

var shopUser = require('../models/ShopUserModel');
router.prefix('/admin')

router.get('/', async function (ctx, next) {
  let loginbean = ctx.session.loginbean;
  if(loginbean){
     let   cpage=1;
    if(ctx.query.cpage){
      cpage=req.query.cpage;
    }
  let   pageItem=20;    //每页显示条目数
 let   startPoint = (cpage-1)*pageItem; //查询起点位置
  let    rowCount=0;   //总记录数
  let   sumPage=0;   //总页数

   let  sqlCount = 'select count(*) as count  from shops';
   let row=await sequelize.query(sqlCount,{replacements: [],type: sequelize.QueryTypes.QUERY});
      let  rsjson = JSON.parse(JSON.stringify(row));
       rowCount=rsjson[0].count;
     sumPage=Math.ceil(rowCount/pageItem);//Math.floor,Math.round
    let sql=" SELECT *  FROM  shops ,shoptypes where shops.shoptype=shoptypes.id limit ?,?";
    let shopRs=await   sequelize.query(sql,{replacements: [startPoint,pageItem],type: sequelize.QueryTypes.QUERY});
    console.log(shopRs);
  	await ctx.render('admin/adminIndex', {shop:shopRs[0]});
  }else{
  	ctx.redirect('/adminLogin.html');
  }
   
});





router.post('/login', async (ctx, next) => {
	let result=await new Promise(function (resolve,reject){
   Users.findOne({where:{email:ctx.request.body.email,pwd:ctx.request.body.pwd}}).then(function(rs){
		if(rs!=null){
		let  loginbean=new Object();
			loginbean.id = rs.id;
			loginbean.nicheng = rs.nicheng;
			loginbean.adminrole = rs.role;
		    loginbean.msgnum = rs.msgnum;
		ctx.session.loginbean=loginbean;
			//ctx.redirect(req.body.url);
			resolve(1);
		}else{
			resolve(2);
			
		}
	});
});
   if(result==1){
   	//ctx.body="登陆成功！"
   	ctx.redirect("./");
   }else{
   		ctx.body="email/密码错误！"
  }
})


router.post('/newShop', async (ctx, next) => {
  console.log("JJJJJJJJJJJ");

	var form = new formidable.IncomingForm();   //创建上传表单 
    form.encoding = 'utf-8';        //设置编辑 
    form.uploadDir = './public/images/shop/';     //设置上传目录 文件会自动保存在这里 
    form.keepExtensions = true;     //保留后缀 
    form.maxFieldsSize = 5 * 1024 * 1024 ;   //文件大小5M 
    let fields=await new Promise(function (resolve,reject){
    form.parse(ctx.req, function (err, fields, files) { 
        if(err){ 
            console.log(err); 
            return;
        } 
      
     
       fields.photourl=files.photourl.path.replace('public','');
       fields.createtime=new Date();
       resolve(fields);
      });
 });

    //----------事物处理-----------------------
  let t = await sequelize.transaction();
  try{
      console.log("ssssssssssssss");
    let creaters = await shop.create(fields, {transaction: t});
             let  shopUserObj={};
              shopUserObj.shopid=creaters.null;
              shopUserObj.email=fields.email;
              shopUserObj.pwd=fields.pwd;
              shopUserObj.nicheng=fields.shopname;
              shopUserObj.createtime =new Date();

            await   shopUser.create(shopUserObj, {transaction: t});
    
             t.commit();
             
          ctx.redirect("./");

   }catch(err){
    console.log(err);
    t.rollback();
     if(err.errors[0].path=='emailuniq'){
      ctx.body='账号重复';
     }else{
       ctx.body = '数据库错误';
    }
    
   
   }

      
        });    


 
     
     

     

         

module.exports = router
