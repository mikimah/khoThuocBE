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
        sql += ' LIMIT 1'; 

        const [rows] = await db.query(sql, params);
        return rows.length > 0; 
    },

    create: async (data) => {
        // ĐÃ BỔ SUNG: loai_baoquan
        const { tenthuoc, sodangky, dieukienbaoquan, loai_baoquan, mota, donvicoban, trangthai } = data;
        const sql = `INSERT INTO thuoc (tenthuoc, sodangky, dieukienbaoquan, loai_baoquan, mota, donvicoban, trangthai) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const [result] = await db.query(sql, [
            tenthuoc, 
            sodangky, 
            dieukienbaoquan, 
            loai_baoquan || 'THUONG', // Mặc định là THUONG nếu frontend không gửi
            mota, 
            donvicoban, 
            trangthai
        ]);
        return result;
    },

    update: async (id, data) => {
        // ĐÃ BỔ SUNG: loai_baoquan
        const { tenthuoc, sodangky, dieukienbaoquan, loai_baoquan, mota, donvicoban, trangthai } = data;
        const sql = `UPDATE thuoc 
                     SET tenthuoc = ?, sodangky = ?, dieukienbaoquan = ?, loai_baoquan = ?, mota = ?, donvicoban = ?, trangthai = ? 
                     WHERE mathuoc = ?`;
        const [result] = await db.query(sql, [tenthuoc, sodangky, dieukienbaoquan, loai_baoquan, mota, donvicoban, trangthai, id]);
        return result;
    },

    updateStatusWithLock: async (id, data) => {
        // ĐÃ BỔ SUNG: loai_baoquan
        const { tenthuoc, sodangky, dieukienbaoquan, loai_baoquan, mota, donvicoban, trangthai } = data;
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const [result] = await connection.query(
                `UPDATE thuoc
                 SET tenthuoc = ?, sodangky = ?, dieukienbaoquan = ?, loai_baoquan = ?, mota = ?, donvicoban = ?, trangthai = ?
                 WHERE mathuoc = ?`,
                [tenthuoc, sodangky, dieukienbaoquan, loai_baoquan, mota, donvicoban, trangthai, id]
            );

            // Khi ngừng kinh doanh thuốc -> Khóa toàn bộ lô
            await connection.query(
                `UPDATE lothuoc SET trangthai = 'khoalo' WHERE mathuoc = ?`,
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