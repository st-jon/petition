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
module.exports.getUserAndCheckSigner = (email) => {
    return db.query(`
        SELECT users.first_name, users.last_name, users.id, users.password, signatures.id AS sign_id
        FROM users 
        LEFT JOIN signatures 
        ON users.id = signatures.user_id
        WHERE email= $1`, 
        [email]
    )
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

// ADD USER PROFIL 
module.exports.addProfile = (age, city, url, userID) => {
    return db.query(`
        INSERT INTO user_profiles (age, city, url, user_id)
        VALUES ($1, $2, $3, $4) RETURNING *`, 
        [age, city, url, userID]
    )
}

// GET ALL SIGNERS AND PROFILES
module.exports.getSignersProfiles = () => {
    return db.query(`
        SELECT first_name, last_name, age, city, url 
        FROM users
        LEFT JOIN user_profiles
        ON users.id = user_profiles.user_id
        JOIN signatures
        ON users.id = signatures.user_id
    `)
} 

// GET ALL SIGNERS FROM CITY
module.exports.getSignersFromCity = (city) => {
    return db.query(`
        SELECT first_name, last_name, age, url 
        FROM users
        LEFT JOIN user_profiles
        ON users.id=user_profiles.user_id  
        JOIN signatures
        ON users.id = signatures.user_id 
        WHERE user_profiles.city = $1;`,
        [city]
    )
}