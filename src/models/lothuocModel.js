const db = require('../configs/db');

const LoThuocModel = {
    // 1. Lấy tất cả lô thuốc (kèm tên thuốc và giá nhập gần nhất)
    getAll: async () => {
        await db.query(`UPDATE lothuoc SET trangthai = 'khoalo' WHERE hansudung < CURDATE() AND trangthai != 'khoalo'`);
        const sql = `SELECT l.*, t.tenthuoc,
                        (SELECT ct.dongia FROM chitietdonhang ct
                         JOIN donhang dh ON ct.madonhang = dh.madonhang
                         WHERE ct.malo = l.malo AND dh.loaidonhang = 'nhap'
                         ORDER BY dh.ngaytao DESC LIMIT 1) AS gianhapgannhat
                     FROM lothuoc l
                     JOIN thuoc t ON l.mathuoc = t.mathuoc
                     ORDER BY l.ngaynhap DESC`;
        const [rows] = await db.query(sql);
        return rows;
    },

    getByThuocId: async (mathuoc) => {
        await db.query(`UPDATE lothuoc SET trangthai = 'khoalo' WHERE hansudung < CURDATE() AND trangthai != 'khoalo'`);
        const sql = `
            SELECT l.*, 
            (SELECT ct.dongia FROM chitietdonhang ct 
             JOIN donhang dh ON ct.madonhang = dh.madonhang 
             WHERE ct.malo = l.malo AND dh.loaidonhang = 'nhap' 
             ORDER BY dh.ngaytao DESC LIMIT 1) AS gianhapgannhat
            FROM lothuoc l 
            WHERE l.mathuoc = ? AND l.tonkhadung > 0 
            ORDER BY l.hansudung ASC
        `;
        const [rows] = await db.query(sql, [mathuoc]);
        return rows;
    },

    // 2. Lấy lô theo mã
    getById: async (malo) => {
        const sql = 'SELECT * FROM lothuoc WHERE malo = ?';
        const [rows] = await db.query(sql, [malo]);
        return rows;
    },

    // 2b. Lấy trạng thái thuốc theo mã lô
    getThuocTrangThaiByLo: async (malo) => {
        const sql = `SELECT t.trangthai
                     FROM lothuoc l
                     JOIN thuoc t ON l.mathuoc = t.mathuoc
                     WHERE l.malo = ?
                     LIMIT 1`;
        const [rows] = await db.query(sql, [malo]);
        return rows;
    },

    // 3. Thêm mới một lô thuốc (Nhập kho)
    create: async (data) => {
        const { solo, mathuoc, tonthucte, tonkhadung, hansudung, mavitri, trangthai, ngaynhap, ngaysanxuat } = data;
        const sql = `INSERT INTO lothuoc 
                    (solo, mathuoc, tonthucte, tonkhadung, hansudung, mavitri, trangthai, ngaynhap, ngaysanxuat) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const [result] = await db.query(sql, [solo, mathuoc, tonthucte, tonkhadung, hansudung, mavitri, trangthai, ngaynhap, ngaysanxuat]);
        return result;
    },

    // 4. Cập nhật thông tin lô (Sửa số lượng, đổi vị trí kệ...)
    update: async (malo, data) => {
        const { solo, mavitri, ngaysanxuat, hansudung, tonthucte, tonkhadung, trangthai } = data;
        const sql = `UPDATE lothuoc 
                     SET solo = ?, mavitri = ?, ngaysanxuat = ?, hansudung = ?, tonthucte = ?, tonkhadung = ?, trangthai = ? 
                     WHERE malo = ?`;
        const [result] = await db.query(sql, [solo, mavitri, ngaysanxuat, hansudung, tonthucte, tonkhadung, trangthai, malo]);
        return result;
    },

    // 5. Xóa lô thuốc (Chỉ dùng khi nhập sai hoàn toàn)
    delete: async (malo) => {
        const sql = 'DELETE FROM lothuoc WHERE malo = ?';
        const [result] = await db.query(sql, [malo]);
        return result;
    }
};

module.exports = LoThuocModel;