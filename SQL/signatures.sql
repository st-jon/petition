DROP TABLE If EXISTS signatures;

CREATE TABLE signatures (
    id SERIAL PRIMARY KEY,
    signature TEXT NOT NULL CHECK (signature <> ''),
    user_id INTEGER REFERENCES users(id) UNIQUE NOT NULL,
    created_at TIMESTAMP default CURRENT_TIMESTAMP
);