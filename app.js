const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const config = require('./config/database');
const bodyParser = require('body-parser');
const session = require('express-session');
const expressValidator = require('express-validator');
const fileUpload = require('express-fileupload');
const passport = require('passport');

mongoose.connect(config.database,{
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

mongoose.set("useCreateIndex", true)

const app = express();

app.set('views', path.join(__dirname,'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname,'public')));

app.locals.errors = null;

const Page = require('./models/page');

Page.find({}).sort({sorting:1}).exec((err,pages) => {
  if(err) console.log(err);
  else {
    app.locals.pages = pages
  }
});

const Category = require('./models/category');

Category.find({},(err,categories) => {
  if(err) console.log(err);
  else {
    app.locals.categories = categories;
  }
});

app.use(fileUpload());

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
  //cookie: { secure: true }
}))

app.use(expressValidator({
  errorFormatter: function(params,msg,value){
    var namespace = params.split('.')
    ,root = namespace.shift()
    ,formParam = root;

    while(namespace.length) {
      formParam += '{' +namespace.shift() + '}'
    }

    return {
      param: formParam,
      msg: msg,
      value: value
    };
  },
  customValidators: {
    isImage: function(value, filename) {
      var extension = (path.extname(filename)).toLowerCase();
      switch(extension) {
        case '.jpg':
        return '.jpg';
        case '.jpeg':
        return '.jpeg';
        case '.png':
        return '.png';
        case '':
        return '.jpg';
        default:
        return 'false';
      }
    }
  }
}));

app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

require('./config/passport')(passport);

app.use(passport.initialize());
app.use(passport.session());


app.get('*', (req,res,next) => {
  res.locals.cart = req.session.cart;
  res.locals.user = req.user || null;
  next();
})

const pages = require('./routes/pages.js');
const adminOrders = require('./routes/adminorders.js');
const products = require('./routes/products.js');
const cart = require('./routes/cart.js');
const users = require('./routes/users.js');
const adminPages = require('./routes/adminpages.js');
const adminCategories = require('./routes/admincategory.js');
const adminProducts = require('./routes/adminproducts.js');


app.use('/admin/pages',adminPages);
app.use('/admin/categories', adminCategories);
app.use('/admin/products', adminProducts);
app.use('/admin/orders', adminOrders);
app.use('/products', products);
app.use('/cart', cart);
app.use('/users',users)
app.use('/', pages);

let port = process.env.PORT;
if(port == null || port == "") {
  port=3000;
}


app.listen(port,() => {
  console.log("Server started on port 3000");
});
