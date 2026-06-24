const db = require('../configs/db');

const chitietkiemkeModel = {
    // Lấy chi tiết của 1 phiếu kiểm kê cụ thể (JOIN thêm lothuoc để lấy số lô hiển thị cho đẹp)
    getByPhieuId: async (maphieu) => {
        const sql = `SELECT ct.*, l.solo, l.tonthucte AS ton_he_thong
                 FROM chitietkiemke ct
                 LEFT JOIN lothuoc l ON ct.malo = l.malo
                 WHERE ct.maphieu = ?`;
        const [rows] = await db.query(sql, [maphieu]);
        return rows;
    },
    create: async (data) => {
        const { maphieu, malo, soluong_tru, lydo } = data;
        const sql = `INSERT INTO chitietkiemke (maphieu, malo, soluong_tru, lydo) VALUES (?, ?, ?, ?)`;
        const [result] = await db.query(sql, [maphieu, malo, soluong_tru, lydo]);
        return result;
    },
    update: async (id, data) => {
        const { malo, soluong_tru, lydo } = data;
        const sql = `UPDATE chitietkiemke SET malo = ?, soluong_tru = ?, lydo = ? WHERE id = ?`;
        const [result] = await db.query(sql, [malo, soluong_tru, lydo, id]);
        return result;
    },
    delete: async (id) => {
        const sql = 'DELETE FROM chitietkiemke WHERE id = ?';
        const [result] = await db.query(sql, [id]);
        return result;
    }
};
module.exports = chitietkiemkeModel;