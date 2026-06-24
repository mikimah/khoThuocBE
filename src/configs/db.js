const mysql = require('mysql2/promise'); // BẮT BUỘC phải có /promise
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',       
    password: process.env.DB_PASS || '',       
    database: process.env.DB_NAME || 'quanlykhothuoc',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Kiểm tra kết nối thử
pool.getConnection()
    .then(conn => {
        console.log('Đã kết nối MySQL thành công');
        conn.release(); 
    })
    .catch(err => {
        console.error('Lỗi kết nối Database:', err.message);
    });

// QUAN TRỌNG NHẤT: Export trực tiếp biến pool ra ngoài
module.exports = pool;