const spicedPg = require('spiced-pg')
const {dbUser, dbPass} = require('./secrets')

const db = spicedPg(`postgres:${dbUser}:${dbPass}@localhost:5432/petition`)


// ADD SIGNER
module.exports.addSigner = (signature, id) => {
    return db.query(`
        INSERT INTO signatures (signature, user_id)
        VALUES ($1, $2) RETURNING *`, 
        [signature, id]
    )
}

// GET SIGNER
module.exports.getSigner = (id) => {
    return db.query(`
        SELECT * FROM signatures WHERE id = ${id}
    `)
}

// USER ALREADY SIGNED
module.exports.alreadySigned = (id) => {
    return db.query(`
        SELECT id FROM signatures WHERE user_id = ${id}
    `)
}


// GET ALL SIGNERS
module.exports.getAllSigners = () => {
    return db.query(`
        SELECT first_name, last_name FROM users INNER JOIN signatures ON users.id = signatures.user_id
    `)
}

// GET SIGNATURES COUNT
module.exports.getRowCount = () => {
    return db.query(`
        SELECT COUNT (*) FROM signatures
    `)
}

// ADD USER
module.exports.addUser = (firstName, lastName, email, password) => {
    return db.query(`
        INSERT INTO users (first_name, last_name, email, password)
        VALUES ($1, $2, $3, $4) RETURNING *`, 
        [firstName, lastName, email, password]
    )
}

// GET USER
module.exports.getUser = (email) => {
    return db.query(`
        SELECT * FROM users WHERE email = $1`,
        [email]
    )
}