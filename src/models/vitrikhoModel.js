const db = require('../configs/db');

const vitrikhoModel = {
    getAll: async () => {
        const sql = 'SELECT * FROM vitrikho ORDER BY makhuvuc, day, ke, tang ASC';
        const [rows] = await db.query(sql);
        return rows;
    },
    getById: async (mavitri) => {
        const sql = 'SELECT * FROM vitrikho WHERE mavitri = ?';
        const [rows] = await db.query(sql, [mavitri]);
        return rows;
    },
    create: async (data) => {
        const { mavitri, makhuvuc, day, ke, tang } = data;
        const sql = `INSERT INTO vitrikho (mavitri, makhuvuc, day, ke, tang) VALUES (?, ?, ?, ?, ?)`;
        const [result] = await db.query(sql, [mavitri, makhuvuc, day, ke, tang]);
        return result;
    },
    update: async (mavitri, data) => {
        const { makhuvuc, day, ke, tang } = data;
        const sql = `UPDATE vitrikho SET makhuvuc = ?, day = ?, ke = ?, tang = ? WHERE mavitri = ?`;
        const [result] = await db.query(sql, [makhuvuc, day, ke, tang, mavitri]);
        return result;
    },
    delete: async (mavitri) => {
        const sql = 'DELETE FROM vitrikho WHERE mavitri = ?';
        const [result] = await db.query(sql, [mavitri]);
        return result;
    }
};
module.exports = vitrikhoModel;