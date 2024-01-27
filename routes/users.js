const express = require("express");
const router = express.Router();
const productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");
const otpHelpers = require("../helpers/otp-helpers");
const { PLAYER_COLLECTION } = require("../config/collection");
const { response } = require("express");

const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next();
  } else {
    res.redirect("/login");
  }
};

/* Home users listing. */
router.get("/", function (req, res, next) {
  let user = req.session.user;
  if (req.session.user) {
    res.render("users/home", { layout: "users-home-layout", home: true, user });
  }
  res.render("users/home", { layout: "users-home-layout", home: true });
});

router.get("/login", (req, res) => {
  req.session.user = req.body;
  if (req.session.loggedIn) {
    res.redirect("/");
  } else {
    res.render("users/login", {
      layout: "login-layout",
      home: true,
      loginErr: req.session.loginErr,
    });
  }
  req.session.loginErr = false;
});

router.post("/login", (req, res) => {
  userHelpers.doUserLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true;
      req.session.user = response.user;
      req.session.loginErr = false; // Clear login error if login is successful
      res.redirect("/");
    } else {
      req.session.loginErr = "Mobile Number and Password are not matching";
      res.redirect("/login");
    }
  });
});

router.get("/signup", (req, res) => {
  if (req.session.loggedIn) {
    res.redirect("/");
  } else {
    res.render("users/signup", { layout: "login-layout", home: true });
  }
});

router.post("/signup", (req, res) => {
  console.log(req.body);
  req.session.user = req.body;
  otpHelpers.makeOtp(req.session.user.number).then((response) => {
    console.log(response);
    res.redirect("/otp");
  });
});

router.get("/otp", (req, res) => {
  if (req.session.otpVerified) {
    // If OTP is verified, redirect to home or any other page
    res.redirect("/");
  } else {
    // If OTP is not verified, render the OTP entering page
    res.render("users/otp", { layout: "login-layout", home: true });
  }
});

router.post("/otp", (req, res) => {
  const userNumber = req.session.user.number;
  const userData = req.session.user;
  const enteredOtp = req.body.otp; // Assuming the OTP is sent as req.body.otp

  otpHelpers
    .verifyOtp(userNumber, { otp: enteredOtp }) // Assuming the verifyOtp function expects an object with the OTP
    .then((verified) => {
      if (verified.status === "approved") {
        // OTP verification successful
        req.session.otpVerified = true;

        // Check if the user is already logged in
        if (req.session.loggedIn) {
          res.redirect("/");
        } else {
          // Perform login if not already logged in
          userHelpers
            .doUserSignup(userData)
            .then(() => {
              req.session.loggedIn = true;
              res.redirect("/");
            })
            .catch((loginError) => {
              // Handle login error
              console.error("Login error:", loginError);
              req.session.otpVerified = false;
              req.session.loginErr =
                "An error occurred during login. Please try again.";
              res.redirect("/login");
            });
        }
      } else {
        // Handle OTP verification failure
        req.session.otpVerified = false;
        req.session.loginErr = "Invalid OTP. Please enter the correct OTP.";
        res.redirect("/login");
      }
    })
    .catch((error) => {
      // Handle OTP verification error
      console.error("OTP verification error:", error);
      req.session.otpVerified = false;
      req.session.loginErr =
        "An error occurred during OTP verification. Please try again.";
      res.redirect("/login");
    });
});

router.get("/logout", (req, res) => {
  console.log("Logout Success");
  req.session.loggedIn = false;
  req.session.user = null;
  req.session.otpVerified = false;
  res.redirect("/");
});

/* shopping users list */

router.get("/shopping", (req, res) => {
  let user = req.session.user;
  if (req.session.user) {
    res.render("shop/index", {
      layout: "users-shop-layout-3",
      shop: true,
      user,
    });
  }
  res.render("shop/index", { layout: "users-shop-layout-3", shop: true });
});

router.get("/home", function (req, res, next) {
  let user = req.session.user;
  if (req.session.user) {
    res.render("users/home", { layout: "users-home-layout", home: true, user });
  }
});

router.get("/shop", async (req, res) => {
  let user = req.session.user;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  productHelpers.getAllproducts().then((products) => {
    res.render("shop/shop", {
      layout: "users-shop-layout",
      shop: true,
      products,
      user,
      cartCount,
    });
  });
});

router.get("/contact", (req, res) => {
  let user = req.session.user;
  if (req.session.user) {
    res.render("shop/contact", {
      layout: "users-shop-layout-2",
      shop: true,
      user,
    });
  }
  res.render("shop/contact", { layout: "users-shop-layout-2", shop: true });
});

/* players users list */

router.get("/players", (req, res) => {
  productHelpers.getAllPlayers().then((players) => {
    let user = req.session.user;
    if (req.session.user) {
      res.render("users/players", {
        layout: "users-home-layout",
        home: true,
        players,
        user,
      });
    }
    res.render("users/players", {
      layout: "users-home-layout",
      home: true,
      players,
    });
  });
});

router.get("/player-details/:id", async function (req, res) {
  let players = await productHelpers
    .getPlayerDetails(req.params.id)
    .then((players) => {
      res.render("users/player-details", {
        layout: "login-layout",
        home: true,
        players,
      });
    });
});

router.get("/playerform", (req, res) => {
  let user = req.session.user;
  if (req.session.user) {
    res.render("users/playerform", {
      layout: "users-home-layout",
      home: true,
      user,
    });
  }
});

router.post("/add-player", function (req, res, next) {
  playerHelpers.addPlayer(req.body, req.file).then(() => {
    res.redirect("/users/players");
  });
});

/* Umpires users list */

router.get("/umpires", (req, res) => {
  productHelpers.getAllUmpires().then((umpires) => {
    let user = req.session.user;
    if (req.session.user) {
      res.render("users/umpires", {
        layout: "users-home-layout",
        home: true,
        umpires,
        user,
      });
    }
    res.render("users/umpires", {
      layout: "users-home-layout",
      home: true,
      umpires,
    });
  });
});

/* Officials users list */

router.get("/officials", (req, res) => {
  productHelpers.getAllOfficials().then((officials) => {
    let user = req.session.user;
    if (req.session.user) {
      res.render("users/officials", {
        layout: "users-home-layout",
        home: true,
        officials,
        user,
      });
    }
    res.render("users/officials", {
      layout: "users-home-layout",
      home: true,
      officials,
    });
  });
});

router.get("/error", (req, res) => {
  res.render("users/funny-error", { layout: "users-home-layout", home: true });
});

/* news */

router.get("/news", (req, res) => {
  productHelpers.getNews().then((news) => {
    let user = req.session.user;
    if (req.session.user) {
      res.render("users/news", {
        layout: "users-home-layout",
        home: true,
        news,
        user,
      });
    }
    res.render("users/news", { layout: "users-home-layout", home: true, news });
  });
});

// cart //

router.get("/cart", verifyLogin, async (req, res) => {
  const user = req.session.user;
  const cartCount = await userHelpers.getCartCount(req.session.user._id);
  const products = await userHelpers.getCartProducts(req.session.user._id);
  let totalValue = await userHelpers.getTotalAmount(req.session.user._id);
  if (cartCount) {
    res.render("shop/cart", {
      layout: "users-shop-layout-2",
      shop: true,
      user,
      products,
      totalValue,
      ftotal: totalValue + 100,
    });
  } else {
    res.render("shop/no-cart", { layout: "login-layout", shop: true, user });
  }
});

router.get("/single-product/:id", async function (req, res) {
  let product = await productHelpers
    .getSingleProDetails(req.params.id)
    .then((product) => {
      res.render("shop/single-product", { layout: "login-layout", product });
    });
});

router.get("/add-to-cart/:id", (req, res) => {
  userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true });
  });
});

router.post("/change-product-quantity", (req, res, next) => {
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelpers.getTotalAmount(req.body.user);
    res.json(response);
  });
});

router.get("/delete-cart/:id", function (req, res, next) {
  const cartId = req.params.id;
  userHelpers.deleteCart(cartId).then(() => {
    res.redirect("/shop/cart");
  });
});

router.get("/place-order", verifyLogin, async (req, res) => {
  let user = req.session.user;
  let total = await userHelpers.getTotalAmount(req.session._id);
  let totalValue = await userHelpers.getTotalAmount(req.session.user._id);
  res.render("shop/checkout", {
    layout: "users-shop-layout-2",
    shop: true,
    user: req.session.user,
    ftotal: totalValue + 100,
  });
});

router.post("/buy", async (req, res) => {
  let products = await userHelpers.getCartProductList(req.body.userId);
  totalPrice = await userHelpers.getTotalAmount(req.body.userId);
  userHelpers
    .placeOrder(req.body, products, totalPrice + 100)
    .then((response) => {
      if (req.body["paymentMethod"] === "COD") {
        res.json({ codSuccess: true });
      } else {
        userHelpers.generateRazorpay(response, totalPrice).then((response) => {
          res.json(response);
        });
      }
    });
});

router.get("/success", verifyLogin, (req, res) => {
  let user = req.session.user;
  if (req.session.user) {
    res.render("shop/success", {
      layout: "users-shop-layout-2",
      shop: true,
      user,
    });
  }
});

router.get("/order-list", verifyLogin, async (req, res) => {
  let user = req.session.user;
  let orders = await userHelpers.getUserOrders(req.session.user._id);
  res.render("shop/order-list", {
    layout: "users-shop-layout-2",
    shop: true,
    user,
    orders,
  });
});

router.get("/view-order-products/:id", verifyLogin, async (req, res) => {
  let user = req.session.user;
  if (req.session.user) {
    let products = await userHelpers.getOrderProducts(req.params.id);
    res.render("shop/view-order-products", {
      layout: "users-shop-layout-2",
      shop: true,
      user,
      products,
    });
  }
});

router.get("/user", verifyLogin, (req, res) => {
  let user = req.session.user;
  if (req.session.user) {
    res.render("shop/user", { layout: "login-layout", shop: true, user });
  }
});

router.post("/verify-payment", (req, res) => {
  userHelpers
    .verifyPayment(req.body)
    .then(() => {
      userHelpers.changePaymentStatus(req.body["order[receipt]"]).then(() => {
        res.json({ status: true });
      });
    })
    .catch((err) => {
      console.log(err);
      req.json({ status: false });
      console.log("payment moonji");
    });
});

module.exports = router;
