const express = require('express')
const hb = require('express-handlebars')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
var cookieSession = require('cookie-session')

const {addSigner, getSigner, getAllSigners, getRowCount} = require('./db')
const {cookieSecret} = require('./secrets')

const app = express()

app.use(bodyParser.urlencoded({extended: false}))
app.use(cookieParser())
app.use(cookieSession({
    secret: `${cookieSecret}`,
    maxAge: 1000 * 60 * 60 * 24 * 14
}));

app.use(express.static(__dirname + '/public/'))

app.engine('handlebars', hb())
app.set('view engine', 'handlebars')

let private = (req, res, next) => {
    if(!req.session.id) {
        res.redirect('/error')
    } else {
        next()
    }
}

app.get('/', (req, res) => {
    res.redirect('/petition')
})

app.get('/petition', (req, res) => {
    getRowCount()
        .then(result => {
            res.render('petition', {
                title: '...Petition',
                count: result.rows[0].count,
                layout: 'main'
            })
        })
})

app.post('/petition', (req, res) => {
    addSigner(req.body.firstName, req.body.lastName, req.body.signature)
        .then((data) => {
            console.log('added new entry in database')
            req.session = {
                id: data.rows[0].id,
                name: `${data.rows[0].first_name} ${data.rows[0].last_name}`
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
                name: `${data.rows[0].first_name} ${data.rows[0].last_name}`,
                signature: data.rows[0].signature
            })
        })
})

app.get('/signers', private, (req, res) => {
    getAllSigners()
        .then((data) => {
            res.render('signers', {
                signers: data.rows,
                layout: 'main'
            })
        })  
})

app.get('/logout', (req, res) => {
    req.session = null
    res.redirect('/petition')
})

app.get(['/error', '*'], (req, res) => {
    res.render('error')
})

app.listen(8080, () => console.log('server up and listen on port 8080'))
