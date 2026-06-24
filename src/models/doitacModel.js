const db = require('../configs/db');

const DoiTacModel = {
    // 1. Lấy tất cả đối tác
    getAll: async () => {
        const sql = 'SELECT * FROM doitac ORDER BY madoitac DESC';
        const [rows] = await db.query(sql);
        return rows;
    },

    // 2. Lấy đối tác theo ID
    getById: async (id) => {
        const sql = 'SELECT * FROM doitac WHERE madoitac = ?';
        const [rows] = await db.query(sql, [id]);
        return rows;
    },

    // 3. Lọc đối tác theo Loại (NhaCungCap hoặc KhachHang) - Rất quan trọng cho giao diện
    getByLoai: async (loaidoitac) => {
        const sql = 'SELECT * FROM doitac WHERE loaidoitac = ? ORDER BY tendoitac ASC';
        const [rows] = await db.query(sql, [loaidoitac]);
        return rows;
    },

    // 3b. Kiểm tra trùng số điện thoại hoặc email
    findByPhoneOrEmail: async (sodienthoai, email, excludeId = null) => {
        const conditions = [];
        const params = [];

        if (sodienthoai) {
            conditions.push('sodienthoai = ?');
            params.push(sodienthoai);
        }

        if (email) {
            conditions.push('LOWER(email) = LOWER(?)');
            params.push(email);
        }

        if (conditions.length === 0) return [];

        let sql = `SELECT * FROM doitac WHERE (${conditions.join(' OR ')})`;
        if (excludeId) {
            sql += ' AND madoitac != ?';
            params.push(excludeId);
        }

        const [rows] = await db.query(sql, params);
        return rows;
    },

    // 4. Thêm mới đối tác
    create: async (data) => {
        const { tendoitac, masothue, loaidoitac, diachi, sodienthoai, email, hanmucno, tongnohientai, trangthai, solangiaodich_thanhcong } = data;
        const sql = `INSERT INTO doitac 
                    (tendoitac, masothue, loaidoitac, diachi, sodienthoai, email, hanmucno, tongnohientai, trangthai, solangiaodich_thanhcong) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const [result] = await db.query(sql, [
            tendoitac, masothue, loaidoitac, diachi, sodienthoai, email, 
            hanmucno || 0, tongnohientai || 0, trangthai || 'Dang hop tac', solangiaodich_thanhcong || 0
        ]);
        return result;
    },

    // 5. Cập nhật thông tin đối tác
    update: async (id, data) => {
        const { tendoitac, masothue, loaidoitac, diachi, sodienthoai, email, hanmucno, tongnohientai, trangthai, solangiaodich_thanhcong } = data;
        const sql = `UPDATE doitac 
                     SET tendoitac=?, masothue=?, loaidoitac=?, diachi=?, sodienthoai=?, email=?, hanmucno=?, tongnohientai=?, trangthai=?, solangiaodich_thanhcong=? 
                     WHERE madoitac = ?`;
        const [result] = await db.query(sql, [
            tendoitac, masothue, loaidoitac, diachi, sodienthoai, email, hanmucno, tongnohientai, trangthai, solangiaodich_thanhcong, id
        ]);
        return result;
    },

    // 6. Xóa đối tác
    delete: async (id) => {
        const sql = 'DELETE FROM doitac WHERE madoitac = ?';
        const [result] = await db.query(sql, [id]);
        return result;
    }
};

module.exports = DoiTacModel;