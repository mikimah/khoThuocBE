const db = require('../configs/db');

const donvitinhModel = {
    getAll: async () => {
        const sql = `SELECT dv.*, t.tenthuoc 
                     FROM donvitinh dv
                     LEFT JOIN thuoc t ON dv.mathuoc = t.mathuoc`;
        const [rows] = await db.query(sql);
        return rows;
    },

    getByThuocId: async (mathuoc) => {
        const sql = 'SELECT * FROM donvitinh WHERE mathuoc = ?';
        const [rows] = await db.query(sql, [mathuoc]);
        return rows;
    },

    // 🔥 ĐỒNG BỘ: Hàm check trùng lặp (true/false)
    checkDuplicate: async (tendonvi, mathuoc, excludeId = null) => {
        let sql = 'SELECT 1 FROM donvitinh WHERE tendonvi = ? AND mathuoc = ?';
        const params = [tendonvi, mathuoc];
        
        if (excludeId) {
            sql += ' AND madonvitinh != ?';
            params.push(excludeId);
        }
        sql += ' LIMIT 1';

        const [rows] = await db.query(sql, params);
        return rows.length > 0;
    },

    create: async (data) => {
        const { tendonvi, hesoquydoi, mathuoc } = data;
        const sql = `INSERT INTO donvitinh (tendonvi, hesoquydoi, mathuoc) VALUES (?, ?, ?)`;
        const [result] = await db.query(sql, [tendonvi, hesoquydoi, mathuoc]);
        return result;
    },

    update: async (id, data) => {
        const { tendonvi, hesoquydoi, mathuoc } = data;
        const sql = `UPDATE donvitinh SET tendonvi = ?, hesoquydoi = ?, mathuoc = ? WHERE madonvitinh = ?`;
        const [result] = await db.query(sql, [tendonvi, hesoquydoi, mathuoc, id]);
        return result;
    },

    delete: async (id) => {
        const sql = 'DELETE FROM donvitinh WHERE madonvitinh = ?';
        const [result] = await db.query(sql, [id]);
        return result;
    }
};

module.exports = donvitinhModel;