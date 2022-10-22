const express = require('express');
const router = express.Router();
const path = require("path")
const productHelpers = require('../helpers/product-helpers')
const adminHelpers = require('../helpers/admin-helpers')
const multer = require('multer');
const { log } = require('console')
const { CATEGORY_COLLECTION } = require('../config/collection');

/* GET home page. */

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      cb(null, './public/upload')
    }
    catch (error) {
      res.redirect("/admin/error-500")
    }
  },

  filename: function (req, file, cb) {
    try {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null,
        file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)
      );
    } catch (error) {
      res.redirect("/admin/error-500");

    }

  }
})

const upload = multer({ storage: storage })
const verifylogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next();
  } else {
    res.redirect('/admin');
  }
};



/////// product session /////////


router.get('/products', verifylogin, function (req, res) {
  productHelpers.getAllproducts().then((products) => {
    res.render('admin/products', { layout: 'admin-layout', products })
  })


});


router.get('/add-products', verifylogin, function (req, res) {
  productHelpers.getAllCategory().then((categories) => {
    res.render('admin/add-products', { layout: 'admin-layout', categories })
  })

});


router.post('/add-products', upload.array("files", 3), function (req, res) {
  console.log(req.body);
  productHelpers.addProduct(req.body, req.files).then(() => {
    res.redirect('/admin/products')

  })

})


router.get('/edit-products/:id', verifylogin, async function (req, res) {
  let products = await productHelpers.getProductsDetails(req.params.id).then((products) => {
    productHelpers.getAllCategory().then((categories) => {
      res.render('admin/edit-product', { layout: 'admin-layout', admin: true, products, categories })
    })
  })
})


router.post('/edit-products/:id', upload.array('files', 3), function (req, res, next) {
  let id = req.params.id;
  productHelpers.updateProducts(req.body, id, req.files)
    .then(() => {
      res.redirect("/admin/products");
    });

})




router.get('/delete-product/:id', function (req, res, next) {
  const proId = req.params.id;
  productHelpers.deleteProduct(proId).then(() => {
    res.redirect("/admin/products");
  });
})


// category session //


router.get('/category', verifylogin, function (req, res) {
  productHelpers.getCategory().then((category) => {
    res.render('admin/category', { layout: 'admin-layout', admin: true, category })
  })

})


router.get('/add-category', verifylogin, function (req, res) {
  productHelpers.getCategory().then((category) => {
    res.render('admin/add-category', { layout: 'admin-layout', admin: true })
  })
})


router.post('/add-category', upload.single('files'), function (req, res, next) {
  productHelpers.addCategory(req.body, req.file).then(() => {
    res.redirect("/admin/category");
  });
  console.log(req.body, req.file);
})


router.get('/delete-category/:id', function (req, res, next) {
  const catId = req.params.id;
  productHelpers.deleteCategory(catId).then(() => {
    res.redirect("/admin/category");
  });
})


router.get('/edit-category/:id', verifylogin, async function (req, res) {
  let category = await productHelpers.getCategoryDetails(req.params.id).then((category) => {
    res.render('admin/edit-category', { layout: 'admin-layout', admin: true, category })
  })

})



router.post('/edit-category/:id', upload.single('files'), function (req, res, next) {
  let id = req.params.id
  productHelpers.updateCategory(req.body, id, req.file)
    .then(() => {
      console.log(req.params.id);
      res.redirect("/admin/category");
    });
  console.log(req.body, req.file);
})


// router.get("/orders", async (req, res) => {

//      res.render('admin/orders', { layout: 'admin-layout', admin: true})
//   })



router.get("/orders", async (req, res) => {
  const orders = await productHelpers.getUserOrders().then()
  res.render('admin/orders', { layout: 'admin-layout', admin: true, orders })

});


router.get('/accept/:id',verifylogin, (req, res) => {
  productHelpers.acceptOrders(req.params.id).then()
  res.redirect('/admin/orders')
})


router.get('/decline/:id',verifylogin, (req, res) => {
  productHelpers.declineOrders(req.params.id).then()
  res.redirect('/admin/orders')
})




router.get('/', function (req, res, next) {
  if (req.session.loggedIn) {
    res.redirect('/admin/admin-page')
  } else {
    res.render('admin/admin-login', { layout: 'admin-layout', loginErr: req.session.loginErr });
    req.session.loginErr = false

  }
});



router.get('/admin-page', verifylogin, (req, res) => {
  const admin = req.session.admin;
  console.log(admin);
  res.render('admin/admin-page', { layout: 'admin-layout', admin: true, admin });
});



router.post('/admin-login', (req, res) => {
  adminHelpers
    .adminLogin(req.body)
    .then((response) => {
      if (response.status) {
        req.session.loggedIn = true
        req.session.admin = response.admin
        res.redirect('/admin/admin-page');
      } else {
        req.session.loginErr = true
        res.redirect('/admin');
      }
    })
    .catch((error) => {
      if (error.serverError) {
        res.redirect('/admin/error-500');
      }
    });
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/')

})


// Umpire session //


router.get('/umpires', verifylogin, function (req, res) {
  productHelpers.getAllUmpires().then((umpires) => {
    res.render('admin/umpires', { layout: 'admin-layout', admin: true, umpires })
  })

});

router.get('/add-umpires', verifylogin, function (req, res) {
  res.render('admin/add-umpires', { layout: 'admin-layout' })

});


router.post('/add-umpire', upload.array("files", 1), function (req, res) {
  console.log(req.body);
  productHelpers.addUmpire(req.body, req.files).then(() => {
    res.redirect('/admin/umpires')

  })

})

router.get('/delete-umpire/:id', function (req, res, next) {
  const umpireId = req.params.id;
  productHelpers.deleteUmpire(umpireId).then(() => {
    res.redirect("/admin/umpires");
  });
})


// Officials session //


router.get('/officials', verifylogin, function (req, res) {
  productHelpers.getAllOfficials().then((officials) => {
    res.render('admin/officials', { layout: 'admin-layout', admin: true, officials })
  })

});


router.get('/add-officials', verifylogin, function (req, res) {
  res.render('admin/add-officials', { layout: 'admin-layout' })

});

router.post('/add-officials', upload.array("files", 1), function (req, res) {
  console.log(req.body);
  productHelpers.addOfficial(req.body, req.files).then(() => {
    res.redirect('/admin/officials')

  })
})


router.get('/delete-official/:id', function (req, res, next) {
  const officialId = req.params.id;
  productHelpers.deleteOfficial(officialId).then(() => {
    res.redirect("/admin/officials");
  });
})



// Player Session //


router.get('/players', verifylogin, function (req, res) {
  productHelpers.getAllPlayers().then((players) => {
    res.render('admin/players', { layout: 'admin-layout', admin: true, players })
  })

});


router.get('/add-player', verifylogin, function (req, res) {
  res.render('admin/add-player', { layout: 'admin-layout' })

});

router.post('/add-player', upload.array("files", 1), function (req, res) {
  console.log(req.body);
  productHelpers.addPlayer(req.body, req.files).then(() => {
    res.redirect('/admin/players')

  })
})

router.post('/addbyplayer', upload.array("files", 1), function (req, res) {
  console.log(req.body);
  productHelpers.addPlayer(req.body, req.files).then(() => {
    res.render('users/home', { layout: 'users-home-layout', home: true })

  })
})

router.get('/delete-player/:id', function (req, res, next) {
  const playerId = req.params.id;
  productHelpers.deletePlayer(playerId).then(() => {
    res.redirect("/admin/players");
  });
})

///// news session /////




router.get('/news', verifylogin, function (req, res) {
  productHelpers.getNews().then((news) => {
    res.render('admin/news', { layout: 'admin-layout', news })

  })

});

router.get('/add-news', verifylogin, function (req, res) {
  res.render('admin/add-news', { layout: 'admin-layout', })

});


router.post('/add-news', upload.array("files", 1), function (req, res) {
  productHelpers.addNews(req.body).then(() => {
    res.redirect('/admin/news')

  })
})

router.get('/delete-news/:id', function (req, res, next) {
  const newsId = req.params.id;
  productHelpers.deleteNews(newsId).then(() => {
    res.redirect("/admin/news");
  });
})

module.exports = router;
