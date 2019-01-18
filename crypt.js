let {genSalt, hash, compare} = require('bcryptjs')
const {promisify} = require('util')

genSalt = promisify(genSalt)
hash = promisify(hash)
compare = promisify(compare)

module.exports.hashPassword = (password) => {
    return new Promise((resolve, reject) => {
        genSalt((err, salt) => {
            if (err) {
                return reject(err)
            }
            hash(password, salt, (err, hash) => {
                if (err) {
                    return reject(err)
                }
                resolve(hash)
            })
        })
    })
}

module.exports.checkPassword = (submitText, hash) => {
    return new Promise((resolve, reject) => {
        compare(submitText, hash, (err, doesMatch) => {
            if (err) {
                reject(err.message)
            } else {
                resolve(doesMatch)
            }
        })
    })
}