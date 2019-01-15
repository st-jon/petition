const express = require('express')
const hb = require('express-handlebars')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const cookieSession = require('cookie-session')
const csurf = require('csurf')

const {addSigner, getSigner, alreadySigned, getAllSigners, getRowCount, addUser, getUser} = require('./db')
const {hashPassword, checkPassword} = require('./crypt')
const {cookieSecret} = require('./secrets')

const app = express()

app.use(bodyParser.urlencoded({extended: false}))
app.use(cookieParser())
app.use(cookieSession({
    secret: `${cookieSecret}`,
    maxAge: 1000 * 60 * 60 * 24 * 14
}))
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
                    count: result.rows[0].count > 0 ? `${result.rows[0].count} persons have already` : `You'll be the first to`,
                    layout: 'main'
                })
            })     
    }
})

app.post('/register', (req, res) => {
    hashPassword(req.body.password)
        .then(hash => {
            return addUser(req.body.firstName, req.body.lastName, req.body.email, hash)
        })
        .then(data => {
            console.log('added new user in database Users')
            req.session = {
                userID: data.rows[0].id,
                name: `${data.rows[0]['first_name']} ${data.rows[0]['last_name']}`,
            }
            res.redirect('/petition')
        })
        .catch(err => {
            console.log(err.message)
                res.render('register', {
                    errorMessage: "Hu Ho... something went wrong !",
                    layout: 'main'
                })
        })  
})

app.get('/login', (req, res) => {
    res.render('login', {
        layout: 'main'
    })
})

app.post('/login', (req, res) => {
    let userID = ''
    let name = ''
    getUser(req.body.email).then(data => {
        userID = data.rows[0].id
        name = `${data.rows[0]['first_name']} ${data.rows[0]['last_name']}`
        return checkPassword(req.body.password, data.rows[0].password)
    })
    .then(bool => {
        if (bool) {
            alreadySigned(userID).then(result => {
                if (result.rows.length >= 1) {
                    req.session = {
                        userID,
                        name,
                        id: result.rows[0].id
                    }
                    res.redirect('/thanks')
                } else {
                    req.session = {
                        userID,
                        name
                    }
                    res.redirect('/petition')
                }
            })
            
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

app.get('/signers', private, (req, res) => {
    getAllSigners()
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
