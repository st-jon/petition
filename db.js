const spicedPg = require('spiced-pg')
const {dbUser, dbPass} = require('./secrets')

const db = spicedPg(`postgres:${dbUser}:${dbPass}@localhost:5432/petition`)

module.exports.addSigner = (firstName, lastName, signature) => {
    return db.query(`
        INSERT INTO signatures (first_name, last_name, signature)
        VALUES ($1, $2, $3) RETURNING *`, 
        [firstName, lastName, signature]
    )
}

module.exports.getSigner = (id) => {
    return db.query(`
        SELECT * FROM signatures WHERE id = ${id}
    `)
}

module.exports.getAllSigners = () => {
    return db.query(`
        SELECT first_name, last_name FROM signatures
    `)
}

module.exports.getRowCount = () => {
    return db.query(`
        SELECT COUNT (*) FROM signatures
    `)
}