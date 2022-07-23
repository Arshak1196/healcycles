var express = require('express');
var router = express.Router();
const userHelper = require('../helpers/user-helpers');
const twilioHelper = require('../helpers/twilioHelpers');
const productHelper = require('../helpers/productHelpers');
const userHelpers = require('../helpers/user-helpers');
const { response } = require('express');
const async = require('hbs/lib/async');
const adminHelpers = require('../helpers/adminHelpers');
const verifyLogin = (req, res, next) => {
  if (req.session.userLoggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}

let filteredProducts

/* user login and signup */
router.get('/', async function (req, res, next) {
  try {
    let user = req.session.user;
    let count = {};
    if (req.session.userLoggedIn) {
      const countData = await Promise.all([
        userHelper.getCartCount(user._id),
        userHelper.getWishlistCount(user._id)
      ])
      count = { cartCount: countData[0], wishlistCount: countData[1] }
    }
    const allData = await Promise.all([
      adminHelpers.getBanner(),
      productHelper.getLatestProducts(),
      productHelper.getPopularProducts()
    ])
    let banner = allData[0]
    let products = allData[1]
    let popular = allData[2]
    res.render('user/home', { banner, popular, count, products, user, layout: 'user-layout' });
  } catch (error) {
    next(error)
  }
});

router.get('/login', (req, res, next) => {
  try {
    res.header('Cache-control', 'no-cache,private, no-store, must-revalidate,max-stale=0,post-check=0')
    if (req.session.userLoggedIn) {
      res.redirect('/')
    } else {
      res.render('user/login', { userErr: req.session.userErr, userss: true, layout: 'user-layout' })
      req.session.userErr = false;
    }
  } catch (error) {
    next(error)
  }
})

router.post('/signin', (req, res, next) => {
  userHelper.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.userLoggedIn = true;
      req.session.user = response.user;
      res.redirect('/');
    } else {
      req.session.userErr = true;
      res.redirect('/login');
    }
  }).catch((error) => {
    next(error)
  })
})

router.get('/signup', (req, res, next) => {
  try {
    res.header('Cache-control', 'no-cache,private, no-store, must-revalidate,max-stale=0,post-check=0')
    if (req.session.userLoggedIn) {
      res.redirect('/')
    } else {
      let exists = req.session.exist
      res.render('user/signup', { exists, userss: true, layout: 'user-layout' })
      req.session.exist = false;
    }
  } catch (error) {
    next(error)
  }
})

router.post('/signup', (req, res, next) => {
  req.session.body = req.body
  userHelper.checkUnique(req.body).then((response) => {
    if (response.exist) {
      req.session.exist = true;
      res.redirect('/signup')
    } else {
      twilioHelper.doSms(req.session.body).then((data) => {
        if (data) {
          res.redirect('/otp')
        } else {
          res.redirect('/signup');
        }
      })
    }
  }).catch((error) => {
    next(error)
  })
})

router.get('/otp', (req, res, next) => {
  try {
    res.render('user/otp', { layout: 'user-layout' })
  } catch (error) {
    next(error)
  }
})


router.post('/otp', (req, res, next) => {
  twilioHelper.otpVerify(req.body, req.session.body).then((response) => {
    if (response.valid) {
      userHelper.doSignup(req.session.body).then((response) => {
        res.redirect('/login')
      })
    } else {
      res.redirect('/otp');
    }
  }).catch((error) => {
    next(error)
  })
})

//home Page
router.get('/account', verifyLogin, async (req, res, next) => {
  try {
    let user = req.session.user
    let count = {};
    const countData = await Promise.all([
      userHelper.getCartCount(user._id),
      userHelper.getWishlistCount(user._id),
      userHelper.getuserDetails(user._id)
    ])
    count = { cartCount: countData[0], wishlistCount: countData[1] }
    let userDetails = countData[2]
    res.render('user/account', { count, user, userDetails, layout: 'user-layout' })
  } catch (error) {
    next(error)
  }
})

router.post('/edit-account', verifyLogin, async (req, res, next) => {
  try {
    userHelper.editAccountDetails(req.session.user._id, req.body)
    res.redirect('/account')
  } catch (error) {
    next(error)
  }
})

router.get('/contact', async (req, res, next) => {
  try {
    let user = req.session.user;
    let count = {};
    if (req.session.userLoggedIn) {
      const countData = await Promise.all([
        userHelper.getCartCount(user._id),
        userHelper.getWishlistCount(user._id)
      ])
      count = { cartCount: countData[0], wishlistCount: countData[1] }
    }
    res.render('user/contact', { user, count, layout: 'user-layout' })
  } catch (error) {
    next(error)
  }
})

router.post('/send_message', async (req, res) => {
  let response = await adminHelpers.doMessage(req.body)
  res.json(response)
})
//view products

router.get('/shop', async (req, res, next) => {
  try {
    let user = req.session.user;
    let count = {};
    if (req.session.userLoggedIn) {
      const countData = await Promise.all([
        userHelper.getCartCount(user._id),
        userHelper.getWishlistCount(user._id)
      ])
      count = { cartCount: countData[0], wishlistCount: countData[1] }
    }
    res.render('user/shop', { count, user, products: filteredProducts, layout: 'user-layout' })
  } catch (error) {
    next(error)
  }
})

router.get('/shopAll', (req, res, next) => {
  productHelper.getAllProducts().then((response) => {
    filteredProducts = response;
    res.redirect('/shop')
  }).catch((error) => {
    next(error)
  })
})

router.get('/shop/:category', async (req, res, next) => {
  try {
    filteredProducts = await productHelper.getProductsByCategory(req.params.category)
    res.redirect('/shop')
  } catch (error) {
    next(error)
  }
})

router.post('/products/filter', (req, res) => {
  const detail = req.body;
  const price = parseInt(detail.price);
  const filter = [];
  for (const i of detail.categoryName) {
    filter.push({ 'category': i });
  }
  productHelper.filterProducts(filter, price).then((response) => {
    filteredProducts = response;
    if (req.body.sort == 'Sort') {
      res.json({ status: true });
    }
    if (req.body.sort == 'lh') {
      filteredProducts.sort((a, b) => a.price - b.price);
      res.json({ status: true });
    }
    if (req.body.sort == 'hl') {
      filteredProducts.sort((a, b) => b.price - a.price);
      res.json({ status: true });
    }
    if (req.body.sort == 'az') {
      filteredProducts.sort(function (a, b) {
        return (a.name < b.name) ? -1 : (a.name > b.name) ? 1 : 0;
      });
      res.json({ status: true });
    }
    if (req.body.sort == 'za') {
      filteredProducts.sort(function (a, b) {
        return (a.name > b.name) ? -1 : (a.name < b.name) ? 1 : 0;
      });
      res.json({ status: true });
    }
  });
});

router.post('/search-products', async (req, res, next) => {
  try {
    filteredProducts = await productHelper.searchProducts(req.body.key)
    res.redirect('/shop')
  } catch (error) {
    next(error)
  }
})

router.get('/shop/product/:id', async (req, res, next) => {
  try {
    let user = req.session.user;
    let id = req.params.id
    let count = {};
    if (req.session.userLoggedIn) {
      const countData = await Promise.all([
        userHelper.getCartCount(user._id),
        userHelper.getWishlistCount(user._id)
      ])
      count = { cartCount: countData[0], wishlistCount: countData[1] }
    }
    let product = await productHelper.getProductDetails(id)
    if (product) {
      res.render('user/single-product', { count, user, product, layout: 'user-layout' })
    } else {
      res.redirect('/shop')
    }
  } catch (error) {
    next(error)
  }
})

//address

router.get('/add_address', verifyLogin, async (req, res, next) => {
  try {
    let user = req.session.user;
    let count = {};
    const countData = await Promise.all([
      userHelper.getCartCount(user._id),
      userHelper.getWishlistCount(user._id),
    ])
    count = { cartCount: countData[0], wishlistCount: countData[1] }
    res.render('user/add_address', { count, user, layout: 'user-layout' })
  } catch (error) {
    next(error)
  }
})

router.post('/address/add_address', verifyLogin, async (req, res, next) => {
  try {
    userHelper.addAddress(req.body, req.session.user._id)
    res.redirect('/cart/checkout')
  } catch (error) {
    next(error)
  }
})

router.get('/delete_address/:addressId', verifyLogin, async (req, res) => {
  const response = await userHelper.deleteAddress(req.params.addressId, req.session.user._id)
  res.json(response)
})

//cart and wishlist

router.get('/wishlist', verifyLogin, async (req, res, next) => {
  try {
    let user = req.session.user;
    let count = {};
    const countData = await Promise.all([
      userHelper.getCartCount(user._id),
      userHelper.getWishlistCount(user._id),
      userHelper.getWishlistProducts(user._id)
    ])
    count = { cartCount: countData[0], wishlistCount: countData[1] }
    products = countData[2]
    res.render('user/wishlist', { products, count, user, layout: 'user-layout' })
  } catch (error) {
    next(error)
  }
})

router.get('/add_to_wishlist/:id', async (req, res) => {
  if (req.session.userLoggedIn) {
    let response = await userHelper.addToWishList(req.params.id, req.session.user._id)
    if (response.wishlisted) {
      res.json({ status: true })
    } else {
      res.json({ status: false })
    }
  } else {
    res.json({ status: false })
  }
})

router.get('/delete_wishlist_product/:prdtId', async (req, res) => {
  let response = await userHelper.deleteWishList(req.params.prdtId, req.session.user._id)
  res.json(response)

})

router.get('/cart', verifyLogin, async (req, res, next) => {
  try {
    let user = req.session.user;
    let count = {};
    const countData = await Promise.all([
      userHelper.getCartCount(user._id),
      userHelper.getWishlistCount(user._id),
      userHelper.getCartproducts(user._id),
      userHelper.getTotalAmount(user._id)
    ])
    count = { cartCount: countData[0], wishlistCount: countData[1] }
    let products = countData[2]
    let totalValue = countData[3]
    res.render('user/cart', { totalValue, count, products, user, layout: 'user-layout' })
  } catch (error) {
    next(error)
  }
})

router.get('/add_to_cart/:id/:quantity', (req, res) => {
  if (req.session.userLoggedIn) {
    userHelper.addToCart(req.params.id, req.session.user._id, req.params.quantity)
    res.json({ status: true })
  } else {
    res.json({ status: false })
  }
})

router.post('/change-product-quantity', (req, res) => {
  userHelper.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelper.getTotalAmount(req.body.user)
    res.json(response)
  })
})

router.post('/delete-cart-item', (req, res) => {
  userHelper.deleteCartItem(req.body).then((response) => {
    res.json({ status: true })
  })
})

//check out and orders

router.get('/cart/checkout', verifyLogin, async (req, res, next) => {
  try {
    let user = req.session.user;
    let count = {};
    const countData = await Promise.all([
      userHelper.getCartCount(user._id),
      userHelper.getWishlistCount(user._id),
      userHelper.getCartproducts(user._id),
      userHelper.getTotalAmount(user._id),
      userHelper.getAllAddresses(user._id)
    ])
    count = { cartCount: countData[0], wishlistCount: countData[1] }
    let products = countData[2]
    let total = countData[3]
    let address = countData[4]
    res.render('user/checkout', { address, products, total, count, user, layout: 'user-layout' })
  } catch (error) {
    next(error)
  }
})

router.post('/placeOrder', async (req, res) => {
  const allData = await Promise.all([
    userHelper.getCartproducts(req.body.usrId),
    userHelper.getTotalAmount(req.body.usrId)
  ])
  let products = allData[0]
  let total = allData[1]
  userHelper.placeOrder(req.body, products, total).then((orderId) => {
    if (req.body.payment === 'COD') {
      res.json({ codSuccess: true })
    } else {
      userHelper.generateRazorpay(orderId, total).then((response) => {
        res.json(response)
      })
    }
  })
})

router.post('/verify-payment', (req, res) => {
  console.log(req.body);
  userHelper.verifyPayment(req.body).then(() => {
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
      console.log("payment success")
      res.json({ status: true })
    })
  }).catch((err) => {
    console.log(err)
    res.json({ status: false, errMsg: 'payment failed' })
  })
})

router.get('/order_success', verifyLogin, async (req, res, next) => {
  try {
    let user = req.session.user;
    let count = {};
    const countData = await Promise.all([
      userHelper.getCartCount(user._id),
      userHelper.getWishlistCount(user._id),
    ])
    count = { cartCount: countData[0], wishlistCount: countData[1] }
    res.render('user/order-success', { count, user, layout: 'user-layout' })
  } catch (error) {
    next(error)
  }
})

router.get('/order_lists', verifyLogin, async (req, res, next) => {
  try {
    let user = req.session.user;
    let count = {};
    const countData = await Promise.all([
      userHelper.getCartCount(user._id),
      userHelper.getWishlistCount(user._id),
      userHelper.getUserOrders(user._id)
    ])
    count = { cartCount: countData[0], wishlistCount: countData[1] }
    let orders = countData[2]
    res.render('user/orderLists', { orders, count, user, layout: 'user-layout' })
  } catch (error) {
    next(error)
  }
})

router.get('/cancel_order/:odrId/:itemId', verifyLogin, async (req, res) => {
  let response = await userHelper.cancelOrder(req.params)
  res.json(response)
})

//logout

router.get('/logout', (req, res) => {
  req.session.user = null;
  req.session.userLoggedIn = null;
  res.redirect('/login')
})


module.exports = router;
