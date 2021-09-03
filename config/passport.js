const localStrategy = require('passport-local').Strategy;
const passport = require('passport')
const User = require('../models/user');
const bcrypt = require('bcryptjs');

module.exports = function(passport) {
  passport.use(new localStrategy((usename, password, done) => {
    User.findOne({username: usename}, (err,user) => {
      if(err) console.log(err);
      if(!user) {
        return done(null,false, {message: 'No User Found!'});
      }
      bcrypt.compare(password, user.password, (err,isMatch) => {
        if(err) console.log(err);
        if(isMatch){
          done(null, user);
        } else {
          return done(null,false, {message: 'Incorrect Password'});
        }
      })
    })
  }))
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err,user) => {
    done(err,user);
  });
});
