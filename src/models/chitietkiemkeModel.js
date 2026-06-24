const db = require('../configs/db');

const chitietkiemkeModel = {
    getByPhieuId: async (maphieu) => {
        const sql = `SELECT ct.*, l.solo, l.tonthucte AS ton_he_thong
                 FROM chitietkiemke ct
                 LEFT JOIN lothuoc l ON ct.malo = l.malo
                 WHERE ct.maphieu = ?`;
        const [rows] = await db.query(sql, [maphieu]);
        return rows;
    },
    
    create: async (data) => {
        const { maphieu, malo, lydo } = data;
        // Tương thích ngược: Nếu Frontend vẫn gửi 'soluong_tru', tự ép sang 'soluong_lech'
        const lech = data.soluong_lech !== undefined ? data.soluong_lech : data.soluong_tru;
        
        const sql = `INSERT INTO chitietkiemke (maphieu, malo, soluong_lech, lydo) VALUES (?, ?, ?, ?)`;
        const [result] = await db.query(sql, [maphieu, malo, lech || 0, lydo]);
        return result;
    },
    
    update: async (id, data) => {
        const { malo, lydo } = data;
        const lech = data.soluong_lech !== undefined ? data.soluong_lech : data.soluong_tru;

        const sql = `UPDATE chitietkiemke SET malo = ?, soluong_lech = ?, lydo = ? WHERE id = ?`;
        const [result] = await db.query(sql, [malo, lech || 0, lydo, id]);
        return result;
    },
    
    delete: async (id) => {
        const sql = 'DELETE FROM chitietkiemke WHERE id = ?';
        const [result] = await db.query(sql, [id]);
        return result;
    }
};

module.exports = chitietkiemkeModel;