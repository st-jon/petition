const passwordValidator = require('password-validator')

checkProfile = (age, city, url) => {
    let profil = {}
    if (url !== '' && !(url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//'))) {
        let adress = 'http://'
        profil.url = adress.concat(url)
    } else if (url !== '') {
        profil.url = url
    }

    if (age) {
        profil.age = age
    }
    if (city) {
        profil.city = city.toLowerCase()
    }
    return profil
}

 
// Create a schema
let PasswordValidator = new passwordValidator()
 
// Add properties to it
PasswordValidator
.is().min(8)                                    // Minimum length 8
.has().uppercase()                              // Must have uppercase letters
.has().lowercase()                              // Must have lowercase letters
.has().digits()                                 // Must have digits
.has().not().spaces()                           // Should not have spaces

module.exports = { PasswordValidator, checkProfile }