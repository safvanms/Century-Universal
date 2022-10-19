const express = require('express');
const router = express.Router();
const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers')
const otpHelpers = require('../helpers/otp-helpers')
const { PLAYER_COLLECTION } = require('../config/collection');
const { response } = require('express');

const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}





/* Home users listing. */
router.get('/', function (req, res, next) {
  let user = req.session.user;
  if (req.session.user) {
    res.render('users/home', { layout: 'users-home-layout', home: true, user })
  }
  res.render('users/home', { layout: 'users-home-layout', home: true })
});





router.get('/login', (req, res) => {
  req.session.user = req.body
  if (req.session.loggedIn) {
    res.redirect('/')
  } else {
    res.render('users/login', { layout: 'login-layout', home: true, loginErr: req.session.loginErr })
  }
  req.session.loginErr = false
})


router.post('/login', (req, res) => {
  userHelpers.doUserLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true;
      req.session.user = response.user;
      res.redirect('/')
    } else {
      req.session.loginErr = false
      req.session.loginErr = "Mobile Number and Password are not matching"
      res.redirect('/login')
    }
  })
})


router.get('/signup', (req, res) => {
  if (req.session.loggedIn) {
    res.redirect('/')
  } else {
    res.render('users/signup', { layout: 'login-layout', home: true })
  }
})



router.post('/signup', (req, res) => {
  console.log(req.body);
  req.session.user = req.body
  otpHelpers.makeOtp(req.session.user.number).then((response) => {
    console.log(response);
    res.redirect('/otp');
  })

})
router.get('/otp', (req, res) => {
  res.render('users/otp', { layout: 'login-layout', home: true })
})




router.post('/otp', (req, res) => {
  const userNumber = req.session.user.number
  const userData = req.session.user
  req.session.otp = req.body;
  otpHelpers.verifyOtp(userNumber, req.session.otp).then((verified) => {
    if (verified) {
      userHelpers.doUserSignup(userData).then((response) => {
        req.session.loggedIn = true;
        res.redirect('/')
      })
    } else {
      res.redirect('/otp')
    }

  })
})


router.get("/logout", (req, res) => {
  console.log("Logout Success")
  req.session.destroy();
  res.redirect("/");

});



/* shopping users list */

router.get('/shopping', (req, res) => {
  let user = req.session.user;
  if (req.session.user) {
    res.render('shop/index', { layout: 'users-shop-layout-2', shop: true, user })
  }
  res.render('shop/index', { layout: 'users-shop-layout-2', shop: true })
})



router.get('/home', function (req, res, next) {
  let user = req.session.user;
  if (req.session.user) {
    res.render('users/home', { layout: 'users-home-layout', home: true, user })
  }
});


router.get('/shop', async (req, res) => {
  let user = req.session.user;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  productHelpers.getAllproducts().then((products) => {

    res.render('shop/shop', { layout: 'users-shop-layout', shop: true, products, user, cartCount })
  })

})





router.get('/contact', (req, res) => {
  let user = req.session.user;
  if (req.session.user) {
    res.render('shop/contact', { layout: 'users-shop-layout-2', shop: true, user })
  }
  res.render('shop/contact', { layout: 'users-shop-layout-2', shop: true })
})







/* players users list */

router.get('/players', (req, res) => {
  productHelpers.getAllPlayers().then((players) => {
    let user = req.session.user;
    if (req.session.user) {
      res.render('users/players', { layout: 'users-home-layout', home: true, players, user })
    }
  })
})




router.get('/player-details/:id', async function (req, res) {
  let players = await productHelpers.getPlayerDetails(req.params.id).then((players) => {
    res.render('users/player-details', { layout: 'login-layout', home: true, players })
  })

})




router.get('/playerform', (req, res) => {
  let user = req.session.user;
  if (req.session.user) {
    res.render('users/playerform', { layout: 'users-home-layout', home: true, user })
  }
})


router.post('/add-player', function (req, res, next) {
  playerHelpers.addPlayer(req.body, req.file).then(() => {
    res.redirect("/users/players");
  });

})



/* Umpires users list */

router.get('/umpires', (req, res) => {
  productHelpers.getAllUmpires().then((umpires) => {
    let user = req.session.user;
    if (req.session.user) {
      res.render('users/umpires', { layout: 'users-home-layout', home: true, umpires, user })
    }
  })

})


/* Officials users list */

router.get('/officials', (req, res) => {
  productHelpers.getAllOfficials().then((officials) => {
    let user = req.session.user;
    if (req.session.user) {
      res.render('users/officials', { layout: 'users-home-layout', home: true, officials, user })
    }
  })

})


router.get('/error', (req, res) => {
  res.render('users/funny-error', { layout: 'users-home-layout', home: true })
})


/* news */


router.get('/news', (req, res) => {
  productHelpers.getNews().then((news) => {
    let user = req.session.user;
    if (req.session.user) {
      res.render('users/news', { layout: 'users-home-layout', home: true, news, user })
    }
  })

})




// cart //


router.get('/cart', verifyLogin, async (req, res) => {
  const user = req.session.user;
  const cartCount = await userHelpers.getCartCount(req.session.user._id)
  const products = await userHelpers.getCartProducts(req.session.user._id)
  let totalValue = await userHelpers.getTotalAmount(req.session.user._id)
  if (cartCount) {
    res.render('shop/cart', { layout: 'users-shop-layout-2', shop: true, user, products, totalValue, ftotal: totalValue + 100 })
  } else {
    res.render('shop/no-cart', { layout: 'login-layout', shop: true, user })
  }

})


router.get('/single-product/:id', async function (req, res) {
  let product = await productHelpers.getSingleProDetails(req.params.id).then((product) => {
    res.render('shop/single-product', { layout: 'login-layout', product })
  })
})


router.get('/add-to-cart/:id', (req, res) => {
  userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true })

  })
})


router.post('/change-product-quantity', (req, res, next) => {
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelpers.getTotalAmount(req.body.user)
    res.json(response)

  })
})


router.get('/delete-cart/:id', function (req, res, next) {
  const cartId = req.params.id;
  userHelpers.deleteCart(cartId).then(() => {
    res.redirect("/shop/cart");
  });
})


router.get('/place-order', verifyLogin, async (req, res) => {
  let user = req.session.user;
  let total = await userHelpers.getTotalAmount(req.session._id)
  let totalValue = await userHelpers.getTotalAmount(req.session.user._id)
  res.render('shop/checkout', { layout: 'users-shop-layout-2', shop: true, user: req.session.user, ftotal: totalValue + 100 })
})


router.post('/buy', async (req, res) => {
  let products = await userHelpers.getCartProductList(req.body.userId)
  totalPrice = await userHelpers.getTotalAmount(req.body.userId)
  userHelpers.placeOrder(req.body, products, totalPrice + 100).then((response) => {
    res.json({ status: true })

  })

})

router.get("/success", verifyLogin, (req, res) => {
  let user = req.session.user;
  if (req.session.user) {
    res.render("shop/success", { layout: 'users-shop-layout-2', shop: true, user });
  }
});

router.get("/order-list", verifyLogin, async (req, res) => {
  let user = req.session.user;
  if (req.session.user) {
    let orders = await userHelpers.getUserOrders(req.session.user._id)
    res.render('shop/order-list', { layout: 'users-shop-layout-2', shop: true, user, orders })
  }
});

router.get("/view-order-products/:id", verifyLogin, async (req, res) => {
  let user = req.session.user;
  if (req.session.user) {
    let products = await userHelpers.getOrderProducts(req.params.id)
    res.render("shop/view-order-products", { layout: 'users-shop-layout-2', shop: true, user, products })
  }
})


router.get("/user", verifyLogin, (req, res) => {
  let user = req.session.user;
  if (req.session.user) {
    res.render("shop/user", { layout: 'login-layout', shop: true, user });
  }
});

module.exports = router;
