const mongoose = require('mongoose')
const User = mongoose.model('User')
const promisify = require('es6-promisify')


exports.loginForm = (req, res) => {
    res.render('login', {title: 'Login'})
}

exports.registerForm = (req, res) => {
    res.render('register', {title: 'Register'})
}

exports.validateRegister = (req, res, next) => {
    req.sanitizeBody('name')
    req.checkBody('name', "You must supply a name").notEmpty()
    req.checkBody('email', "Email address is not valid").isEmail()
    req.sanitizeBody('email').normalizeEmail({
        remove_dots: false,
        remove_extension: false,
        gmail_remove_subaddress: false
    });
    req.checkBody('password', "Password cannot be empty").notEmpty()
    req.checkBody('password-confirm', "Confirm Password cannot be empty").notEmpty()
    req.checkBody('password-confirm', 'Password does not match').equals(req.body.password)

    const errors = req.validationErrors()
    if (errors){
        req.flash('error', errors.map(err => err.msg))
        res.render('register', {
            title: 'Register',
            flashes: req.flash(),
            body: req.body
        })
        return;
    }
    next()
}

exports.register = async (req, res, next) => {
    const user = new User({ email: req.body.email, name: req.body.name });
    const register = promisify(User.register, User);
    await register(user, req.body.password);
    next(); // pass to authController.login
};

exports.logout = (req, res) => {
    req.logout() // will remove the req.user property and clear the login session (if any).
    req.flash('success', 'you are now logged out')
    res.redirect('/')
}

exports.account = (req, res) => {
    res.render('account', {user: req.user, title: 'Account'})
}

exports.editAccount = async (req, res, next) => {
    const updates = {
        name: req.body.name,
        email: req.body.email
    }
    
    const user = await User.findOneAndUpdate(
        { _id: req.user._id }, 
        { $set: updates }, 
        { new: true, //return new store instead of old one
          runValidators: true,
          context: 'query' }
    ).exec();
    req.flash('success', `Sucessfully updated <strong>${user.name}</strong>'s account. `)
    await req.login(user)
    res.redirect('/account')
}

exports.resetPassword = async (req, res, next) => {
    const user = await User.findOne({ 
        resetPasswordToken: req.params.token,
        resetPasswordExpiry: { $gt: Date.now() } //check whether the expiry is greater than now = not expired.
    })
    if (!user) {
        console.log('invalid something.')
        req.flash('error', 'token is invalid or expired')
        return res.redirect('/login');
    }

    const setPassword = promisify(user.setPassword, user)
    await setPassword(req.body.password)

    // Set the token back to undefined
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    const updatedUser = await user.save();
    
    // logs the user back in
    await req.login(updatedUser)
    req.flash('success', 'Your password has been changed')
    res.redirect('/')
}  