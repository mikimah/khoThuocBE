// Import kết nối database
const db = require('../configs/db');

const ThuocModel = {
    getAll: async () => {
        const sql = 'SELECT * FROM thuoc ORDER BY mathuoc DESC';
        const [rows] = await db.query(sql);
        return rows;
    },

    getById: async (id) => {
        const sql = 'SELECT * FROM thuoc WHERE mathuoc = ?';
        const [rows] = await db.query(sql, [id]);
        return rows;
    },

    checkDuplicate: async (tenThuoc, excludeId = null) => {
        let sql = 'SELECT 1 FROM thuoc WHERE LOWER(tenthuoc) = LOWER(?)';
        const params = [tenThuoc];
        
        if (excludeId) {
            sql += ' AND mathuoc != ?';
            params.push(excludeId);
        }
        sql += ' LIMIT 1'; // Tối ưu: Tìm thấy 1 dòng là dừng

        const [rows] = await db.query(sql, params);
        return rows.length > 0; // Trả về true nếu đã tồn tại
    },

    create: async (data) => {
        const { tenthuoc, sodangky, dieukienbaoquan, mota, donvicoban, trangthai } = data;
        const sql = `INSERT INTO thuoc (tenthuoc, sodangky, dieukienbaoquan, mota, donvicoban, trangthai) 
                     VALUES (?, ?, ?, ?, ?, ?)`;
        const [result] = await db.query(sql, [tenthuoc, sodangky, dieukienbaoquan, mota, donvicoban, trangthai]);
        return result;
    },

    update: async (id, data) => {
        const { tenthuoc, sodangky, dieukienbaoquan, mota, donvicoban, trangthai } = data;
        const sql = `UPDATE thuoc 
                     SET tenthuoc = ?, sodangky = ?, dieukienbaoquan = ?, mota = ?, donvicoban = ?, trangthai = ? 
                     WHERE mathuoc = ?`;
        const [result] = await db.query(sql, [tenthuoc, sodangky, dieukienbaoquan, mota, donvicoban, trangthai, id]);
        return result;
    },

    // Cập nhật trạng thái thuốc và khóa toàn bộ lô nếu ngừng kinh doanh
    updateStatusWithLock: async (id, data) => {
        const { tenthuoc, sodangky, dieukienbaoquan, mota, donvicoban, trangthai } = data;
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const [result] = await connection.query(
                `UPDATE thuoc
                 SET tenthuoc = ?, sodangky = ?, dieukienbaoquan = ?, mota = ?, donvicoban = ?, trangthai = ?
                 WHERE mathuoc = ?`,
                [tenthuoc, sodangky, dieukienbaoquan, mota, donvicoban, trangthai, id]
            );

            await connection.query(
                `UPDATE lothuoc
                 SET trangthai = 'khoalo'
                 WHERE mathuoc = ?`,
                [id]
            );

            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    delete: async (id) => {
        const sql = 'DELETE FROM thuoc WHERE mathuoc = ?';
        const [result] = await db.query(sql, [id]);
        return result;
    }
};

module.exports = ThuocModel;