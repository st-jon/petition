DROP TABLE if EXISTS user_profiles;

CREATE TABLE user_profiles(
    id SERIAL PRIMARY KEY,
    age INTEGER,
    city VARCHAR(200),
    url VARCHAR(600),
    user_id INTEGER UNIQUE NOT NULL  REFERENCES users(id) ON DELETE CASCADE
);