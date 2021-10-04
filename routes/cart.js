const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const Order = require('../models/order');
const parseUrl = express.urlencoded({extended:true});
const parseJson = express.json({extended:true})
const checksum_lib = require('../Paytm/checksum');
const config = require('../Paytm/config');

router.get('/add/:product', (req,res) => {

  let slug = req.params.product;

  Product.findOne({slug: slug}, (err,p) => {
    if(err) console.log(err);
    else {
      if(typeof req.session.cart === "undefined"){
        req.session.cart = [];
        req.session.cart.push({
          title: slug,
          qty: 1,
          price: parseFloat(p.price).toFixed(2),
          image: "/product_images/" + p.image
        });
      }else {
        let cart = req.session.cart;
        let newItem = true;

        for(let i=0; i<cart.length; i++){
          if(cart[i].title === slug){
            cart[i].qty++;
            newItem = false;
            break;
          }
        }
        if(newItem) {
          cart.push({
            title: slug,
            qty: 1,
            price: parseFloat(p.price).toFixed(2),
            image: "/product_images/" + p.image
          });
        }
      }
    }
    req.flash("success", "Product added to cart");
    res.redirect('back')
  })
})

router.get('/checkout', (req,res) => {

  if(req.session.cart && req.session.cart.length == 0) {
    delete req.session.cart;
    res.redirect('/cart/checkout');
  } else {
    res.render('checkout', {title: "Checkout", cart: req.session.cart});
  }

})

router.get('/update/:product', (req,res) => {
  let slug = req.params.product;
  let cart = req.session.cart;
  let action =req.query.action;
  for(let i=0; i<cart.length; i++){
    if(cart[i].title === slug){
      switch(action) {
        case "add": cart[i].qty++;
        break;
        case "remove": cart[i].qty--;
        if(cart[i].qty==0) cart.splice(i,1);
        break;
        case "clear": cart.splice(i,1);
        if(cart.length == 0) delete req.session.cart;
        break;
        default: console.log('update problem');
        break;
      }
      break;
    }
  }
  req.flash("success", "Updated");
  res.redirect('/cart/checkout');
})

router.get('/clear', (req,res) => {
  delete req.session.cart;
  req.flash("success", "Cart Cleared");
  res.redirect('/cart/checkout');
})

router.get('/buynow', (req,res) => {

  res.sendStatus(200);

  let order = new Order({
    user: res.locals.user.username,
    email: res.locals.user.email,
    order: req.session.cart
  })
  order.save(err => {
    if(err) console.log(err);
  })
  delete req.session.cart;
})

router.post("/paynow", [parseUrl, parseJson], (req, res) => {
  // Route for making payment
  let paymentDetails = {
    amount: req.body.amount,
    customerId: res.locals.user.username,
    customerEmail: res.locals.user.email
  }

if(!paymentDetails.amount || !paymentDetails.customerId || !paymentDetails.customerEmail) {
    res.status(400).send('Payment failed')
} else {
    var params = {};
    params['MID'] = config.PaytmConfig.mid;
    params['WEBSITE'] = config.PaytmConfig.website;
    params['CHANNEL_ID'] = 'WEB';
    params['INDUSTRY_TYPE_ID'] = 'Retail';
    params['ORDER_ID'] = 'TEST_'  + new Date().getTime();
    params['CUST_ID'] = paymentDetails.customerId;
    params['TXN_AMOUNT'] = paymentDetails.amount;
    params['CALLBACK_URL'] = 'http://localhost:3000/callback';
    params['EMAIL'] = paymentDetails.customerEmail;
    params['MOBILE_NO'] = paymentDetails.customerPhone;


    checksum_lib.genchecksum(params, config.PaytmConfig.key, function (err, checksum) {
        var txn_url = "https://securegw-stage.paytm.in/theia/processTransaction"; // for staging
        // var txn_url = "https://securegw.paytm.in/theia/processTransaction"; // for production

        var form_fields = "";
        for (var x in params) {
            form_fields += "<input type='hidden' name='" + x + "' value='" + params[x] + "' >";
        }
        form_fields += "<input type='hidden' name='CHECKSUMHASH' value='" + checksum + "' >";

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write('<html><head><title>Merchant Checkout Page</title></head><body><center><h1>Please do not refresh this page...</h1></center><form method="post" action="' + txn_url + '" name="f1">' + form_fields + '</form><script type="text/javascript">document.f1.submit();</script></body></html>');
        res.end();
    });
}
});

router.post("/callback", (req, res) => {
  // Route for verifiying payment

  var body = '';

  req.on('data', function (data) {
     body += data;
  });

   req.on('end', function () {
     var html = "";
     var post_data = qs.parse(body);

     // received params in callback
     console.log('Callback Response: ', post_data, "\n");


     // verify the checksum
     var checksumhash = post_data.CHECKSUMHASH;
     // delete post_data.CHECKSUMHASH;
     var result = checksum_lib.verifychecksum(post_data, config.PaytmConfig.key, checksumhash);
     console.log("Checksum Result => ", result, "\n");


     // Send Server-to-Server request to verify Order Status
     var params = {"MID": config.PaytmConfig.mid, "ORDERID": post_data.ORDERID};

     checksum_lib.genchecksum(params, config.PaytmConfig.key, function (err, checksum) {

       params.CHECKSUMHASH = checksum;
       post_data = 'JsonData='+JSON.stringify(params);

       var options = {
         hostname: 'securegw-stage.paytm.in', // for staging
         // hostname: 'securegw.paytm.in', // for production
         port: 443,
         path: '/merchant-status/getTxnStatus',
         method: 'POST',
         headers: {
           'Content-Type': 'application/x-www-form-urlencoded',
           'Content-Length': post_data.length
         }
       };


       // Set up the request
       var response = "";
       var post_req = https.request(options, function(post_res) {
         post_res.on('data', function (chunk) {
           response += chunk;
         });

         post_res.on('end', function(){
           console.log('S2S Response: ', response, "\n");

           var _result = JSON.parse(response);
             if(_result.STATUS == 'TXN_SUCCESS') {
                 res.send('payment sucess')
             }else {
                 res.send('payment failed')
             }
           });
       });

       // post the data
       post_req.write(post_data);
       post_req.end();
      });
     });
});

module.exports = router;
