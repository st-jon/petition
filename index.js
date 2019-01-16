const express = require('express')
const hb = require('express-handlebars')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const cookieSession = require('cookie-session')
const csurf = require('csurf')
const flash = require('connect-flash')
const validator = require("email-validator")


const {addSigner, getSigner, getUserAndCheckSigner, getRowCount, addUser, addProfile, getSignersProfiles, getSignersFromCity} = require('./db')
const {checkProfile, PasswordValidator} = require('./utils')
const {hashPassword, checkPassword} = require('./crypt')
const {cookieSecret} = require('./secrets')

const app = express()

app.use(bodyParser.urlencoded({extended: false}))
app.use(cookieParser())
app.use(cookieSession({
    secret: `${cookieSecret}`,
    maxAge: 1000 * 60 * 60 * 24 * 14
}))
app.use(flash())
app.use(csurf())
app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken()
    res.setHeader('X-frame-Options', 'DENY')
    next()
})
app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken()
    next()
})

app.use(express.static(__dirname + '/public/'))

app.engine('handlebars', hb())
app.set('view engine', 'handlebars')

const private = (req, res, next) => {
    if(!req.session.id) {
        res.redirect('/petition')
    } else {
        next()
    }
}

const hasSigned = (req, res, next) => {
    if(req.session.id) {
        res.redirect('/thanks')
    } else {
        next()
    }
}

app.get('/', (req, res) => {
    res.redirect('/register')
})

app.get('/register', (req, res) => {
    if(req.session.userID){
        res.redirect('/petition')
    } else if (req.session.id) {
        res.redirect('/thanks')
    } else {
        getRowCount()
            .then( result => {
                res.render('register', {
                    count: result.rows[0].count > 0 ? 
                           `${result.rows[0].count} persons have already` : `You'll be the first to`,
                    errorMessage: req.flash('message'),
                    layout: 'main'
                })
            })     
    }
})

app.post('/register', (req, res) => {
    if(req.body.firstName === '' || req.body.lastName === '') {
        req.flash('message', 'Please provide first and last name')
        res.redirect('/register')
        return
    }

    let password = req.body.password
    let validation = PasswordValidator.validate(password, { list: true })

    if (validation.includes('min')) {
        req.flash('message', 'Password must be at least 8 characters')
        res.redirect('/register')
        return
    } else if (validation.includes('uppercase')) {
        req.flash('message', 'Password must contains uppercase character')
        res.redirect('/register')
        return
    } else if (validation.includes('lowercase')) {
        req.flash('message', 'Password must contains lowercase character')
        res.redirect('/register')
        return
    } else if (validation.includes('digits')) {
        req.flash('message', 'Password must contains at least one digit')
        res.redirect('/register')
        return
    } else if (validation.includes('spaces')){
        req.flash('message', 'Password cannot have space inside')
        res.redirect('/register')
        return
    } 

    let email = req.body.email
    if (!validator.validate(email)) {
        req.flash('message', 'please provide a valid email')
        res.redirect('/register')
        return
    }

    hashPassword(password)
        .then(hash => {
            return addUser(req.body.firstName, req.body.lastName, req.body.email, hash)
        })
        .then(data => {
            console.log('added new user in database Users')
            req.session = {
                userID: data.rows[0].id,
                name: `${data.rows[0]['first_name']} ${data.rows[0]['last_name']}`,
            }
            res.redirect('/profil')
        })
        .catch(err => {
            console.log(err)
            let error = err.code === '23505' ? 'Email already registered try to login' : "Hu Ho... something went wrong !"
            res.render('register', {
                errorMessage: error,
                layout: 'main'
            })
        })  
})

app.get('/profil', (req, res) => {
    res.render('profil', {
        name: req.session.name,
        layout: 'main'
    })
})

app.post('/profil', (req, res) => {
    let profile = checkProfile(req.body.age, req.body.city, req.body.url)
    if (Object.keys(profile).length !== 0 && profile.constructor === Object) {
        addProfile(profile.age, profile.city, profile.url, req.session.userID)
            .then(() => {
                res.redirect('/petition')
            })
            .catch(err => {
                let error = err.code === '23505' ? 
                            `You've already set your profil` : "Hu Ho... something went wrong !"
                res.render('register', {
                    errorMessage: error,
                    layout: 'main'
                })
            })
    } else {
        res.redirect('/petition')
    }
})

app.get('/login', (req, res) => {
    res.render('login', {
        layout: 'main'
    })
})

app.post('/login', (req, res) => {
    let userID = ''
    let name = ''
    let signID = ''
    getUserAndCheckSigner(req.body.email).then(data => {
        userID = data.rows[0].id
        name = `${data.rows[0]['first_name']} ${data.rows[0]['last_name']}`
        signID = data.rows[0]['sign_id']? data.rows[0]['sign_id'] : ''
        return checkPassword(req.body.password, data.rows[0].password)
    })
    .then(bool => {
        if (bool) {
            req.session = {userID, name, id: signID}
            res.redirect('/petition')
        } else {
            res.render('login', {
                errorMessage: "You've entered a wrong password.",
                layout: 'main'
            })
        }
    })
    .catch(err => {
        console.log(err.message)
            res.render('login', {
                errorMessage: "email is not registered.",
                layout: 'main'
            })
    })
})

app.get('/petition', hasSigned, (req, res) => {
    getRowCount()
        .then(result => {
            res.render('petition', {
                title: '...Petition',
                name: req.session.name,
                count: result.rows[0].count > 0 ? `${result.rows[0].count} persons have already` : `You'll be the first to`,
                layout: 'main'
            })
        })
})

app.post('/petition', hasSigned, (req, res) => {
    addSigner(req.body.signature, req.session.userID)
        .then((data) => {
            console.log('added new signature in database Signatures')
            req.session = {
                id: data.rows[0].id,
                name: req.session.name
            }
            res.redirect('thanks')
        }).catch(err => {
            console.log(err.message)
            res.render('petition', {
                title: '...Petition',
                errorMessage: "Hu Ho... something went wrong !",
                layout: 'main'
            })
        }) 
})

app.get('/thanks', private, (req, res) => {
    getSigner(req.session.id)
        .then(data => {
            res.render('thanks', {
                layout: 'main',
                name: req.session.name,
                signature: data.rows[0].signature
            })
        })
})

app.get('/signers/:city', (req, res) => {
    getSignersFromCity(req.params.city)
        .then((data)=> {
            res.render('signers', {
                location: req.params.city,
                name: req.session.name,
                signers: data.rows,
                layout: 'main'
            })
        })   
})

app.get('/signers', private, (req, res) => {
    getSignersProfiles()
        .then((data) => {
            res.render('signers', {
                name: req.session.name,
                signers: data.rows,
                layout: 'main'
            })
        })  
})

app.get('/logout', (req, res) => {
    req.session = null
    res.redirect('/register')
})

app.get(['/error', '*'], (req, res) => {
    res.render('error')
})

app.listen(8080, () => console.log('server up and listen on port 8080'))
