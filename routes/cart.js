const express = require('express');
const router = express.Router();
const Product = require('../models/product');

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
  delete req.session.cart;
  res.sendStatus(200);
})

module.exports = router;
