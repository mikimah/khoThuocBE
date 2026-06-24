const db = require('../configs/db');

const vitrikhoModel = {
    // Lấy tất cả vị trí xếp theo loại bảo quản và tọa độ
    getAll: async () => {
        const sql = 'SELECT mavitri, ma_toado, ten_vitri, loai_baoquan FROM vitrikho ORDER BY loai_baoquan, ma_toado ASC';
        const [rows] = await db.query(sql);
        return rows;
    },

    getById: async (mavitri) => {
        const sql = 'SELECT mavitri, ma_toado, ten_vitri, loai_baoquan FROM vitrikho WHERE mavitri = ?';
        const [rows] = await db.query(sql, [mavitri]);
        return rows;
    },

    create: async (data) => {
        const { ma_toado, ten_vitri, loai_baoquan } = data;
        const sql = `INSERT INTO vitrikho (ma_toado, ten_vitri, loai_baoquan) VALUES (?, ?, ?)`;
        const [result] = await db.query(sql, [ma_toado, ten_vitri, loai_baoquan || 'THUONG']);
        return result;
    },

    update: async (mavitri, data) => {
        const { ma_toado, ten_vitri, loai_baoquan } = data;
        const sql = `UPDATE vitrikho SET ma_toado = ?, ten_vitri = ?, loai_baoquan = ? WHERE mavitri = ?`;
        const [result] = await db.query(sql, [ma_toado, ten_vitri, loai_baoquan, mavitri]);
        return result;
    },

    delete: async (mavitri) => {
        const sql = 'DELETE FROM vitrikho WHERE mavitri = ?';
        const [result] = await db.query(sql, [mavitri]);
        return result;
    }
};

module.exports = vitrikhoModel;