module.exports.private = (req, res, next) => {
    if(!req.session.id) {
        res.redirect('/register')
    } else {
        next()
    }
}

module.exports.hasSigned = (req, res, next) => {
    if(req.session.id || !req.session.userID) {
        res.redirect('/thanks')
    } else {
        next()
    }
}

module.exports.isLoggedIn = (req, res, next) => {
    if(req.session.userID) {
        res.redirect('/petition')
    } else {
        next()
    }
}

module.exports.isRegistered = (req, res, next) => {
    if(!req.session.userID) {
        res.redirect('/register')
    } else {
        next()
    }
}