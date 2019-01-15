let {genSalt, hash, compare} = require('bcryptjs')
const {promisify} = require('util')

genSalt = promisify(genSalt)
hash = promisify(hash)
compare = promisify(compare)


module.exports.hashPassword = (plainTextPassword) => {
    return new Promise((resolve, reject) => {
        genSalt((err, salt) => {
            if (err) {
                return reject(err)
            }
            hash(plainTextPassword, salt, (err, hash) => {
                if (err) {
                    return reject(err)
                }
                resolve(hash)
            })
        })
    })
}

module.exports.checkPassword = (textEnteredInLoginForm, hashedPasswordFromDatabase) => {
    return new Promise((resolve, reject) => {
        compare(textEnteredInLoginForm, hashedPasswordFromDatabase, (err, doesMatch) => {
            if (err) {
                reject(err.message)
            } else {
                resolve(doesMatch)
            }
        })
    })
}