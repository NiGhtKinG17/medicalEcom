const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const resizeImg = require('resize-img')
const auth = require('../config/auth')
const isAdmin = auth.isAdmin;

const Product = require('../models/product');
const Category = require('../models/category');

router.get('/', isAdmin, (req,res) => {
  var count;

  Product.countDocuments((err,c) => {
    count = c;
  })

  Product.find((err, products) => {
    res.render('admin/products', {
      products: products,
      count: count
    })
  })
})

router.get('/add-product', isAdmin, (req,res) => {
  var title = "";
  var desc = "";
  var price = "";

  Category.find((err, categories) => {
    res.render('admin/add_product', {
      title:title,
      desc:desc,
      categories: categories,
      price:price
    })
  })

})

router.post('/add-product', (req,res) => {

  if(!req.files){ imageFile =""; }

  if(req.files){

  var imageFile = typeof(req.files.image) !== "undefined" ? req.files.image.name : "";
  }
  req.checkBody('title','Title must have a value').notEmpty();
  req.checkBody('desc','Description must have a value').notEmpty();
  req.checkBody('price','Price must have a value').isDecimal();
  req.checkBody('image','You must upload an image').isImage(imageFile);

  var title = req.body.title;
  var slug = title.replace(/\s+/g, '-').toLowerCase();
  var desc = req.body.desc;
  var price = req.body.price;
  var category = req.body.category;

  var errors = req.validationErrors();

  if(errors){
    Category.find((err, categories) => {
      res.render('admin/add_product', {
        errors: errors,
        title:title,
        desc:desc,
        categories: categories,
        price:price
      })
    });
  }else {
    Product.findOne({slug: slug}, (err, page) => {
      if(product){
        req.flash('danger','Product title exists, choose another');
        Category.find((err, categories) => {
          res.render('admin/add_product', {
            title:title,
            desc:desc,
            categories: categories,
            price:price
          })
        })
      }else {
        var price2 = parseFloat(price).toFixed(2);

        var product = new Product({
          title:title,
          slug:slug,
          desc:desc,
          price: price2,
          category: category,
          image: imageFile
        });
        product.save((err) => {
          if(err) return console.log(err);

            // mkdirp('public/product_images/'+product._id, (err) => {
            //   return console.log(err);
            // });

            if(imageFile !== "") {
              var productImage = req.files.image;
              var path = 'public/product_images/' + imageFile;

              productImage.mv(path, err => {
                return console.log(err);
              })
            }

            req.flash('success','Product added');
            res.redirect('/admin/products')
        })
      }
    })
}});


router.get('/edit-product/:id', isAdmin, (req,res) => {

  var errors;

  if(req.session.errors) errors = req.session.errors;
  req.session.errors = null;

  Category.find((err, categories) => {

    Product.findById(req.params.id, (error,p) => {
      if(err){
        console.log(err);
        res.redirect("/admin/products");
      }else{



            res.render('admin/edit_product', {
              id: req.params.id,
              errors: errors,
              title: p.title,
              desc: p.desc,
              categories: categories,
              category: p.category.replace(/\s+/g, '-').toLowerCase(),
              price:p. price,
              image: p.image
            })

        }

    })


  });
})

router.post('/edit-product/:id', (req,res) => {

  if(!req.files){ imageFile =""; }

  if(req.files){

  var imageFile = typeof(req.files.image) !== "undefined" ? req.files.image.name : "";
  }
  req.checkBody('title','Title must have a value').notEmpty();
  req.checkBody('desc','Description must have a value').notEmpty();
  req.checkBody('price','Price must have a value').isDecimal();
  req.checkBody('image','You must upload an image').isImage(imageFile);

  var title = req.body.title;
  var slug = title.replace(/\s+/g, '-').toLowerCase();
  var desc = req.body.desc;
  var price = req.body.price;
  var category = req.body.category;
  var pimage = req.body.pimage;
  var id = req.params.id;

  var errors = req.validationErrors();

  if(errors) {
    req.session.errors = errors;
    res.redirect('admin/products/edit-product/'+id);
  } else {
    Product.findOne({slug: slug, _id:{'$ne': id}}, (err,p) => {
      if(err) console.log(err);

      if(p){
        req.flash('danger','Product title exists, choose another');
        res.redirect("/admin/products/edit-product/"+id);
      } else {
        Product.findById(id, (err,p) => {
          if(err) console.log(err);

          p.title = title;
          p.slug = slug;
          p.desc = desc;
          p.price = parseFloat(price).toFixed(2);
          p.category = category;
          if(imageFile !== ""){
            p.image = imageFile;
          }

          p.save(err => {
            if(err) console.log(err);

            if(imageFile !== "") {
              if(pimage !== "") {
                fs.remove('public/product_images/'+pimage, (err) => {
                  if(err) console.log(err);
                })
              }
              var productImage = req.files.image;
              var path = 'public/product_images/' + imageFile;

              productImage.mv(path, err => {
                return console.log(err);
              })
            }
            req.flash('success','Product edited');
            res.redirect("/admin/products/edit-product/"+id);
})
        })
      }
    })
  }
});


router.get('/delete-product/:id', isAdmin, (req,res) => {
  Product.findByIdAndRemove(req.params.id, (err) => {
    if(err) console.log(err);
    res.redirect('/admin/products');
  })
})

module.exports = router;
