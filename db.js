const spicedPg = require('spiced-pg')
let db
if (process.env.DATABASE_URL) {
    db = spicedPg(process.env.DATABASE_URL)
} else {
    const {dbUser, dbPass} = require('./secrets')    
    db = spicedPg(`postgres://${dbUser}:${dbPass}@localhost:5432/petition`)
}


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

// GET USER BY EMAIL
module.exports.getUserByEmail = (email) => {
    return db.query(`
        SELECT * FROM users 
        WHERE email = $1`,
        [email]
    )
}

// UPDTAE USER PASSWORD
module.exports.updatePassword = (email, password) => {
    return db.query(`
        UPDATE users 
        SET password = $2
        WHERE email = $1
        RETURNING id, first_name, last_name`,
        [email, password]
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

// GET USER TO EDIT PROFILE
module.exports.getSignersProfilesToEdit = (id) => {
    return db.query(`
        SELECT first_name, email, last_name, age, city, url 
        FROM users
        LEFT JOIN user_profiles
        ON users.id = user_profiles.user_id
        WHERE users.id = $1`, [id]
    )
}

// UPDATE USER
module.exports.updateUser = (id, firstName, lastName, email) => {
    return db.query(`
        UPDATE users
        SET first_name = $2,
            last_name = $3,
            email = $4
        WHERE id = $1`,
        [id, firstName, lastName, email]
    )
}

// UPDATE USER AND PASSWORD
module.exports.updateUserAndPassword = (id, firstName, lastName, email, password) => {
    return db.query(`
        UPDATE users
        SET first_name = $2,
            last_name = $3,
            email = $4,
            password = $5
        WHERE id = $1`,
        [id, firstName, lastName, email, password]
    )
}

// UPSERT USER PROFILE
module.exports.upsertUserProfile = (age, city, url, userID) => {
    return db.query(`
        INSERT INTO user_profiles (age, city, url, user_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id)
        DO UPDATE 
        SET age = $1, 
            city = $2,
            url = $3`,
        [age, city, url, userID]
    )
}

// DELETE SIGNATURES
module.exports.deleteSigner = (id) => {
    return db.query(`
        DELETE FROM signatures 
        WHERE id = $1`,
        [id]
    )
}

// DELETE USER
module.exports.deleteUser = (id) => {
    return db.query(`
        DELETE FROM users 
        WHERE id = $1`,
        [id]
    )
}