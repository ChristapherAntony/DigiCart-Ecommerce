const userHelpers = require('../helpers/user-helpers')

module.exports = {
    verifyUser: (req, res, next) => {
        req.session.returnTo = req.url
        if (req.session.user) {
            next();
        } else {
            userHelpers.getHeaderDetails(req.session.user?._id).then((response) => {
                let headerDetails = response
                res.render('users/login-signUp', { headerDetails });
            })
        }
    },
    verifyAdmin: (req, res, next) => {
        if (req.session.admin) {
            next();
        } else {
            // next();
            res.render('admin/admin-login', { layout: 'admin-layout', login: true });
        }
    }
}

