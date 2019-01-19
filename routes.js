const express = require('express')

const {addSigner, getSigner, getUserAndCheckSigner, getRowCount, addUser, addProfile, getSignersProfiles, getSignersFromCity, getSignersProfilesToEdit, updateUser, updateUserAndPassword, upsertUserProfile, deleteSigner, deleteUser} = require('./db')
const {checkProfile, validateForm} = require('./utils')
const {hashPassword, checkPassword} = require('./crypt')
const {private, hasSigned, isLoggedIn, isRegistered} = require('./middleware')

const app = express()

app.get('/', (req, res) => {
    res.redirect('/register')
})

app.get('/register', isLoggedIn, (req, res) => {
    getRowCount()
        .then( result => {
            res.render('register', {
                message: req.flash('message'),
                errorMessage: req.flash('errorMessage'),
                count: result.rows[0].count > 1 ? 
                        `${result.rows[0].count} times` : `${result.rows[0].count} time`,
                layout: 'main'
            })
        })     
})

app.post('/register', (req, res) => {

    let validation = validateForm(req.body)

    if (validation) {
        req.flash('errorMessage', validation)
        res.redirect('/register')
        return
    }
    if (!req.body.password) {
        req.flash('errorMessage', 'Please provide a password')
        res.redirect('/register')
        return
    }

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

app.get('/selfies', (req, res) => {
    res.render('selfies', {
        layout: 'selfiesmain'
    })
})

app.get('/profil', isRegistered, (req, res) => {
    res.render('profil', {
        name: req.session.name,
        layout: 'main'
    })
})

app.post('/profil', isRegistered, (req, res) => {
    let profile = checkProfile(req.body.age, req.body.city, req.body.url)
    if (Object.keys(profile).length !== 0 && profile.constructor === Object) {
        addProfile(profile.age, profile.city, profile.url, req.session.userID)
            .then(() => {
                req.flash('message', 'Welcome! Thank you for filling the forms')
                res.redirect('/petition')
            })
            .catch(err => {
                let error = err.code === '23505' ? 
                            `You've already set your profil` : "Hu Ho... something went wrong !"
                req.flash('errorMessage', error)
                res.redirect('/petition')
            })
    } else {
        req.flash('message', "thank you! You'll be able to set your profil information by clicking on the icon top left")
        res.redirect('/petition')
    }
})

app.get('/edit', isRegistered, (req, res) => {
    getSignersProfilesToEdit(req.session.userID)
        .then(profile => {
            res.render('edit', {
                errorMessage: req.flash('errorMessage'),
                message: req.flash('message'),
                firstName: profile.rows[0]['first_name'],
                lastName: profile.rows[0]['last_name'],
                email: profile.rows[0].email,
                age: profile.rows[0].age,
                city: profile.rows[0].city,
                url: profile.rows[0].url,
                layout: 'main'
            })
        })
        .catch(err => {
            console.log(err.message)
            res.redirect('back')
        })
})

app.post('/edit', isRegistered, (req, res) => {

    let validation = validateForm(req.body)

    if (validation) {
        req.flash('errorMessage', validation)
        res.redirect('/edit')
        return
    }

    let profile = checkProfile(req.body.age, req.body.city, req.body.url)

    if (req.body.password) {
        hashPassword(req.body.password)
        .then(hash => {
            return Promise.all([
                updateUserAndPassword(req.session.userID, req.body.firstName, req.body.lastName, req.body.email, hash),
                upsertUserProfile(profile.age, profile.city, profile.url, req.session.userID)
            ])
        })
        .then(() => {
            req.session.name = `${req.body.firstName} ${req.body.lastName}`
            req.flash('message', 'Your profile has been edited')
            if (req.session.id) {
                res.redirect('/thanks')
                return
            } else {
                res.redirect('/petition')
                return
            }
        })
        .catch(err => {
            console.log(err)
            let error = err.code === '23505' ? 'Email already registered' : "Hu Ho... something went wrong !"
            res.render('edit', {
                errorMessage: error,
                layout: 'main'
            })
        }) 

    } else {
        Promise.all([
            updateUser(req.session.userID, req.body.firstName, req.body.lastName, req.body.email),
            upsertUserProfile(profile.age, profile.city, profile.url, req.session.userID)
        ])
        .then(() => {
            req.session.name = `${req.body.firstName} ${req.body.lastName}`
            req.flash('message', 'Your profile has been edited')
            if (req.session.id) {
                res.redirect('/thanks')
                return
            } else {
                res.redirect('/petition')
                return
            }
        })
        .catch(err => {
            console.log(err)
            let error = err.code === '23505' ? 'Email already registered' : "Hu Ho... something went wrong !"
            res.render('edit', {
                errorMessage: error,
                layout: 'main'
            })
        })
    }
})

app.get('/login', isLoggedIn, (req, res) => {
    res.render('login', {
        layout: 'main'
    })
})

app.post('/login', isLoggedIn, (req, res) => {
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
                message: req.flash('message'),
                name: req.session.name,
                count: result.rows[0].count > 1 ? 
                           `${result.rows[0].count} times` : `${result.rows[0].count} time`,
                layout: 'main'
            })
        })
})

app.post('/petition', hasSigned, (req, res) => {
    addSigner(req.body.signature, req.session.userID)
        .then((data) => {
            console.log('added new signature in database Signatures')
            req.session.id = data.rows[0].id
            res.redirect('thanks')
        }).catch(err => {
            console.log(err)
            let error = err.code === '23514' ? 'You need to sign the petition before submitting' : "Hu Ho... something went wrong !"
            res.render('petition', {
                errorMessage: error,
                layout: 'main'
            })
        }) 
})

app.get('/thanks', private, (req, res) => {
    getSigner(req.session.id)
        .then(data => {
            res.render('thanks', {
                layout: 'main',
                message: req.flash('message'),
                errorMessage: req.flash('errorMessage'),
                name: req.session.name,
                signature: data.rows[0].signature
            })
        })
})

app.post('/thanks', private, (req, res) => {
    deleteSigner(req.session.id)
        .then(() => {
            req.session.id = null
            req.flash('message', "You've unsigned the petition")
            res.redirect('/petition')
            return
        })
        .catch(err => {
            req.flash('errorMessage', 'something went wrong')
            res.redirect('/thanks')
            return
        })
})

app.get('/signers/:city', private, (req, res) => {
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
    req.session.userID = null
    req.session.id= null
    req.session.name = null
    req.flash('message', "You've been succesfully logged out")
    res.redirect('/register')
    return
})

app.get('/kill', (req, res) => {
    deleteUser(req.session.userID)
        .then(() => {
            req.session.userID = null
            req.session.id= null
            req.session.name = null
            req.flash('message', "You're profile has been deleted")
            res.redirect('/register')
            return
        })
        .catch(err => {
            req.flash('errorMessage', "something went wrong, try again later'")
            res.redirect('/edit')
            return
        })
})

app.get('*', (req, res) => {
    res.render('error')
})

module.exports = app