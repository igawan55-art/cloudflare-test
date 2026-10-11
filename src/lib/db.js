import mysql from 'mysql2/promise';

let pool;

export function getDb() {
    if (!pool) {
        pool = mysql.createPool({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'realestate_db',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
    }
    return pool;
}
