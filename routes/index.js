const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');
const { catchErrors } = require('../handlers/errorHandlers');

router.get('/', catchErrors(storeController.getStores));
router.get('/stores', catchErrors(storeController.getStores));
router.get('/stores/pages/:page', catchErrors(storeController.getStores));
router.get('/store/:slug', catchErrors(storeController.getStore))
router.get('/add', 
    authController.isLoggedIn,
    storeController.addStore
);
router.post('/add',
    storeController.upload,
    catchErrors(storeController.resize),
    catchErrors(storeController.createStore)
);
router.post('/add/:id',
    storeController.upload,
    catchErrors(storeController.resize),
    catchErrors(storeController.updateStore)
);
router.get('/stores/:id/edit', catchErrors(storeController.editStore));
router.get('/tags', catchErrors(storeController.getTags));
router.get('/tags/:tag', catchErrors(storeController.getTags));

router.get('/login', userController.loginForm)
router.post('/login', authController.login)

router.get('/register', userController.registerForm)
router.post('/register', 
    userController.validateRegister,
    userController.register,
    authController.login
)

router.get('/logout', userController.logout)

router.get('/account',
    authController.isLoggedIn,
    userController.account
)
router.post('/account', userController.editAccount)
router.post('/account/forgot', authController.forgot)

router.get('/account/reset/:token', authController.reset)
router.post('/account/reset/:token', 
    authController.validatePassword,
    catchErrors(userController.resetPassword)
)

router.get('/map', storeController.mapPage)
router.get('/hearts', 
    authController.isLoggedIn,
    storeController.getHearts
)
router.post('/reviews/:id',
    authController.isLoggedIn,
    reviewController.addReview
)

router.get('/top', storeController.getTopStores)

// API
router.get('/api/search', catchErrors(storeController.searchStore))
router.get('/api/stores/near', catchErrors(storeController.mapStores))
router.post('/api/stores/:id/heart', catchErrors(storeController.heartStore))

module.exports = router;
