const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');

const User = require('../models/user');

router.get('/register', (req,res) => {
  res.render('register', {title:"Register"});
})

router.post('/register', (req,res) => {
  let name = req.body.name;
  let email = req.body.email;
  let username = req.body.username;
  let password = req.body.password;
  let password2 = req.body.password2;

  req.checkBody('name',"Name is required").notEmpty();
  req.checkBody('email',"Email is required").isEmail();
  req.checkBody('username',"Username is required").notEmpty();
  req.checkBody('password',"Password is required").notEmpty();
  req.checkBody('password2',"Password do not match").equals(password);

  let errors = req.validationErrors();

  if(errors) {
    res.render('register', {errors: errors, user:null, title:"Register"});
  } else {
    User.findOne({username: username}, (err, user) => {
      if(err) console.log(err);
      if(user){
        req.flash('danger', "Username exists! Please choose another");
        res.redirect("/users/register");
      } else {
        let user = new User({
          name: name,
          email: email,
          username: username,
          password: password,
          admin: 0
        })
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(user.password, salt, (err,hash) => {
            if(err) console.log(err);
            user.password = hash;
            user.save(err => {
              if(err) console.log(err);
              else {
                req.flash('success', "User Registered!");
                res.redirect("/users/login")
              }
            });
          });
        });
      }
    })
  }
})

router.get('/login', (req,res) => {
  if(res.locals.user) res.redirect('/');
  res.render('login', {title:"Login", user: res.locals.user});
})

router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/users/login',
    failureFlash: true
  })(req,res,next);
})

router.get('/logout', (req,res) => {
  req.logout();
  req.flash('success', "Logged Out");
  res.redirect("/users/login");
})

module.exports = router;
