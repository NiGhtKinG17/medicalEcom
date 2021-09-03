const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const Category = require('../models/category');

router.get('/', (req,res) => {
  let loggedIn = (req.isAuthenticated()) ? true: false;
  Product.find((err,products) => {
    if(err) console.log(err);
    else {
      res.render('all_products', {
        title: "All Products",
        products: products,
        loggedIn: loggedIn
      })
    }
  })
})

router.get('/:category', (req,res) => {

  let categorySlug = req.params.category;
  let loggedIn = (req.isAuthenticated()) ? true: false;

  Category.findOne({slug: categorySlug}, (err,c) => {
    Product.find({category: categorySlug},(err,products) => {
      if(err) console.log(err);
      else {
        res.render('cat_products', {
          title: c.title,
          products: products,
          loggedIn: loggedIn
        })
      }
    })
  })
})

router.get('/:category/:product', (req,res) => {
  let loggedIn = (req.isAuthenticated()) ? true: false;

  Product.findOne({slug: req.params.product}, (err,p) => {
    if(err) console.log(err);
    else {
      res.render('product', {title: p.title, p: p, loggedIn: loggedIn});
    }
  })
})


module.exports = router;
