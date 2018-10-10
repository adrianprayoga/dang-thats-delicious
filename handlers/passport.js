const passport = require('passport')
const mongoose = require('mongoose')
const User = mongoose.model('User')

//from package passport-mongoose. Also see http://www.passportjs.org/docs/configure/
//Automatically add a Local Strategy
passport.use(User.createStrategy()) 

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());