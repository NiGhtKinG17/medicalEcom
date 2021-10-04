const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const resizeImg = require('resize-img')
const auth = require('../config/auth')
const isAdmin = auth.isAdmin;

const Order = require('../models/order');

router.get('/',isAdmin, (req,res) => {
  Order.find({}, (err,orders) => {
    if(err) console.log(err);
    res.render('admin/orders',{orders:orders});
  })
})

router.get('/delete-order/:id', isAdmin, (req,res) => {
  Order.findByIdAndRemove(req.params.id, err => {
    if(err) console.log(err);
    res.redirect("/admin/orders")
  })
})

module.exports = router;
