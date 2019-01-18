const express = require('express')
const hb = require('express-handlebars')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const cookieSession = require('cookie-session')
const csurf = require('csurf')
const flash = require('connect-flash')

const routes = require('./routes');

const app = new express()

app.use(bodyParser.urlencoded({extended: false}))
app.use(cookieParser())

if (process.env.SESSION_SECRET_COOKIE) {
    app.use(cookieSession({
        secret:  process.env.SESSION_SECRET_COOKIE,
        maxAge: 1000 * 60 * 60 * 24 * 14
    }))
} else {
    const {cookieSecret} = require('./secrets') 
    app.use(cookieSession({
        secret: cookieSecret,
        maxAge: 1000 * 60 * 60 * 24 * 14
    }))
}

app.use(flash())
app.use(csurf())
app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken()
    res.setHeader('X-frame-Options', 'DENY')
    next()
})

app.use(express.static(__dirname + '/public/'))

app.engine('handlebars', hb())
app.set('view engine', 'handlebars')

app.use('/', routes)

app.listen(process.env.PORT || 8080)