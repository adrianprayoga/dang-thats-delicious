const passport = require('passport')
const mongoose = require('mongoose')
const User = mongoose.model('User')
const crypto = require('crypto')
const mail = require('../handlers/mail')

exports.login = passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: 'Failed Login',
    successFlash: 'You are now logged in',
    successRedirect: '/'
})

exports.relogin = passport.authenticate('local', {
    failureRedirect: '/login',
    successRedirect: '/account'
})

exports.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        next();
        return;
    }
    req.flash('error', 'You are not logged in')
    res.redirect('/login')
}

exports.forgot = async (req, res, next) => {
    // 1. See if user exists
    const user = await User.findOne({ email: req.body.email })
    if (!user) {
        req.flash('error', 'A password reset has been sent to you ??')
        res.redirect('/login')
        return;
    }

    // 2. Set reset tokens and expiry on the account
    user.resetPasswordToken = crypto.randomBytes(20).toString('hex')
    user.resetPasswordExpiry = Date.now() + (60 * 60 * 100) // 60 minutes from now
    await user.save()

    // 3. Send them an email with the token
    const resetUrl = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`
    req.flash('success', 'An password reset link has been sent to your email')

    // await a Promise of sending mail
    await mail.send({
        user: user,
        subject: 'Password Reset',
        resetUrl: resetUrl,
        filename: 'password-reset'
    })

    // 4. Redirect them to login page
    res.redirect('/login')
}

exports.reset = async (req, res, next) => {
    const user = await User.findOne({ 
        resetPasswordToken: req.params.token,
        resetPasswordExpiry: { $gt: Date.now() } //check whether the expiry is greater than now = not expired.
    })
    if (!user) {
        console.log('invalid something.')
        req.flash('error', 'token is invalid or expired')
        return res.redirect('/login');
    }
    res.render('reset', {title: 'Reset Password'})
}

exports.validatePassword = (req, res, next) => {
    req.checkBody('password', "Password cannot be empty").notEmpty()
    req.checkBody('password-confirm', "Confirm Password cannot be empty").notEmpty()
    req.checkBody('password-confirm', 'Password does not match').equals(req.body.password)

    const errors = req.validationErrors()
    if (errors){
        req.flash('error', errors.map(err => err.msg))
        res.redirect('back')
        return;
    }
    next();
}