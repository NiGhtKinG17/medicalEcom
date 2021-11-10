const express = require('express');
const router = express.Router();
const Page = require('../models/page');

router.get('/', (req,res) => {

  //Page.findOne({slug: "home"}, (err,page) => {
  //   if(err) console.log(err);
  //   else {
  //     res.render('index', {
  //       title: page.title,
  //       content: page.content
  //     })
  //   }
  // })
  res.render('index');
})

// router.get('/:slug', (req,res) => {
//   const slug = req.params.slug;
//   Page.findOne({slug: slug}, (err,page) => {
//     if(err) console.log(err);
//     if(!page) {
//       res.redirect("/");
//     }
//     else {
//       res.render('index', {
//         title: page.title,
//         content: page.content
//       })
//     }
//   })
// })

router.get('/about-us', (req,res) => {
  res.render('aboutus');
})

module.exports = router;
