const { response } = require('express');
var express = require('express');
const async = require('hbs/lib/async');
const adminHelper = require('../helpers/adminHelpers');
const productHelper = require('../helpers/productHelpers');
const userHelpers = require('../helpers/user-helpers');
var router = express.Router();
const verifyLogin = (req, res, next) => {
  if (req.session.admin) {
    next()
  } else {
    res.redirect('/admin')
  }
}

/* GET home page. */
router.get('/', function (req, res, next) {
  try {
    res.header('Cache-control', 'no-cache,private, no-store, must-revalidate,max-stale=0,post-check=0');
    if (req.session.admin) {
      res.redirect('/admin/home');
    } else {
      res.render('admin/signin', { adminErr: req.session.adminErr, layout: 'admin-layout' });
      req.session.adminErr = false;
    }
  } catch (error) {
    next(error)
  }
});

router.post('/admin_login', (req, res, next) => {
  adminHelper.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.admin = true;
      res.redirect('/admin/home');
    } else {
      req.session.adminErr = true;
      res.redirect('/admin');
    }
  }).catch((error) => {
    next(error)
  })
})

router.get('/home', verifyLogin, async (req, res, next) => {
  try {
    res.header('Cache-control', 'no-cache,private, no-store, must-revalidate,max-stale=0,post-check=0')
    const allData = await Promise.all([
      adminHelper.getUsersCount(),
      adminHelper.getProductsCount(),
      adminHelper.getOrdersCount(),
      adminHelper.getTotalSales(),
      adminHelper.getCODsales(),
      adminHelper.getOnlineSales(),
      adminHelper.getPlacedOrdersCount(),
      adminHelper.getShippedOrdersCount(),
      adminHelper.getCanceledOrders()
    ])
    const count = {
      user: allData[0], product: allData[1], order: allData[2], sales: allData[3],
      cod: allData[4], online: allData[5], placed: allData[6], shipped: allData[7], canceled: allData[8]
    }
    res.render('admin/index', { count, layout: 'admin-layout', admin: true })
  } catch (error) {
    console.log(error);
    next(error)
  }
})

//banners

router.get('/banners', verifyLogin, async (req, res, next) => {
  try {
    res.header('Cache-control', 'no-cache,private, no-store, must-revalidate,max-stale=0,post-check=0')
    const banners = await adminHelper.getAllbanners()
    res.render('admin/banner', { banners, layout: 'admin-layout', admin: true })
  } catch (error) {
    next(error)
  }
})

router.post('/add_banner', verifyLogin, (req, res, next) => {
  try {
    adminHelper.addBanner(req.body, (id) => {
      let image = req.files.image;
      image.mv('./public/banners/' + id + '.png', (err, done) => {
        if (!err) {
          res.redirect('/admin/banners')
        }
      })
    })
  } catch (error) {
    next(error)
  }
})

router.post('/bannerAction', verifyLogin, async (req, res) => {
  if (req.body.action == 'active') {
    let response = await adminHelper.activateBanner(req.body.bannerId)
    res.json(response)
  } else if (req.body.action == 'deactive') {
    let response = await adminHelper.deActivateBanner(req.body.bannerId)
    res.json(response)
  }
})

router.get('/delete_banner/:bannerId', verifyLogin, async (req, res) => {
  let response = await adminHelper.deleteBanner(req.params.bannerId)
  res.json(response)
})

//users

router.get('/users', verifyLogin, (req, res, next) => {
  res.header('Cache-control', 'no-cache,private, no-store, must-revalidate,max-stale=0,post-check=0')
  userHelpers.getAllUsers().then((users) => {
    res.render('admin/view-users', { users, layout: 'admin-layout', admin: true })
  }).catch((error) => {
    next(error)
  })
})

router.post('/userAction', verifyLogin, (req, res) => {
  if (req.body.action == 'unBlock') {
    userHelpers.unBlockUser(req.body.usrId).then((response) => {
      res.json(response)
    })
  } else if (req.body.action == 'block') {
    userHelpers.blockUser(req.body.usrId).then((response) => {
      res.json(response)
    })
  }
})

//products

router.get('/products', verifyLogin, (req, res, next) => {
  res.header('Cache-control', 'no-cache,private, no-store, must-revalidate,max-stale=0,post-check=0')
  productHelper.getAllProducts().then((products) => {
    res.render('admin/view-products', { products, admin: true, layout: 'admin-layout' })
  }).catch((error) => {
    next(error)
  })
})

router.get('/products/view_types', verifyLogin, (req, res, next) => {
  res.header('Cache-control', 'no-cache,private, no-store, must-revalidate,max-stale=0,post-check=0')
  productHelper.getAllBikeTypes().then((bikeTypes) => {
    res.render('admin/view-types', { bikeTypes, admin: true, layout: 'admin-layout' })
  }).catch((error) => {
    next(error)
  })
})

router.post('/products/add_types', verifyLogin, (req, res, next) => {
  try {
    productHelper.addBikeTypes(req.body.types)
    res.redirect('/admin/products/view_types')
  } catch (error) {
    next(error)
  }
})

router.get('/products/delete_subcat/:name', verifyLogin, (req, res, next) => {
  productHelper.deleteBikeTypes(req.params.name).then(() => {
    res.redirect('/admin/products/view_types')
  }).catch((error) => {
    next(error)
  })
})

// router.get('/products/edit_subcat/:index',(req,res)=>{
//   productHelper.editBikeTypes(req.params.index).then(()=>{
//     res.redirect('/admin/products/view_types')
//   })
// })

router.get('/products/add_product', verifyLogin, (req, res, next) => {
  res.header('Cache-control', 'no-cache,private, no-store, must-revalidate,max-stale=0,post-check=0')
  productHelper.getAllBikeTypes().then((bikeTypes) => {
    res.render('admin/add-products', { bikeTypes, admin: true, layout: 'admin-layout' })
  }).catch((error) => {
    next(error)
  })
})

router.post('/products/add_product', verifyLogin, (req, res, next) => {
  try {
    productHelper.addProduct(req.body, (id) => {
      if (req.files) {
        const file = req.files.image;
        for (let i = 0; i < file.length; i++) {
          file[i].mv('./public/product-images/' + id + i + '.jpg', function (err) {
            if (err) {
              res.send(err);
            }
          })
        }
        res.redirect('/admin/products')
      }
    })
  } catch (error) {
    next(error)
  }
})


router.get('/products/edit_product/:id', verifyLogin, async (req, res, next) => {
  try {
    res.header('Cache-control', 'no-cache,private, no-store, must-revalidate,max-stale=0,post-check=0')
    const allData = await Promise.all([
      productHelper.getAllBikeTypes(),
      productHelper.getProductDetails(req.params.id)
    ])
    const bikeTypes = allData[0]
    const product = allData[1]
    res.render('admin/edit-product', { product, bikeTypes, admin: true, layout: 'admin-layout' })
  } catch (error) {
    next(error)
  }
})

router.get('/products/delete_product/:id', verifyLogin, (req, res, next) => {
  let prdtId = req.params.id;
  productHelper.deleteProduct(prdtId).then((response) => {
    res.redirect('/admin/products')
  }).catch((error) => {
    next(error)
  })
})

router.post('/products/edit_product/:id', verifyLogin, (req, res, next) => {
  productHelper.updateProduct(req.params.id, req.body).then(() => {
    res.redirect('/admin/products')
  }).catch((error) => {
    next(error)
  })
})


//orders
const getProducts = (req, res, next) => {
  try {
    res.header('Cache-control', 'no-cache,private, no-store, must-revalidate,max-stale=0,post-check=0')
    adminHelper.getAllOrders().then((orders) => {
      res.render('admin/orders', { orders, admin: true, layout: 'admin-layout' })
    })
  } catch (error) {
    next(error)
  }
}

router.get('/orders', verifyLogin, getProducts)

router.post('/changeDeliveryStatus', verifyLogin, (req, res) => {
  adminHelper.changeOrderDelivery(req.body).then((response) => {
    res.json(response)
  })
})

router.get('/logout', (req, res) => {
  req.session.admin = null;
  res.redirect('/admin');
})

module.exports = router;