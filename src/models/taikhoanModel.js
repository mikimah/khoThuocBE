const db = require('../configs/db');

const taikhoanModel = {
    getAll: async () => {
        // Trả về danh sách tài khoản, tuyệt đối không SELECT matkhau ra ngoài để bảo mật
        const sql = 'SELECT mataikhoan, tendangnhap, vaitro FROM taikhoan ORDER BY mataikhoan DESC'; 
        const [rows] = await db.query(sql);
        return rows;
    },

    // Lấy 1 tài khoản (bao gồm cả mật khẩu để hệ thống đổi pass/kiểm tra nội bộ)
    getById: async (id) => {
        const sql = 'SELECT * FROM taikhoan WHERE mataikhoan = ?';
        const [rows] = await db.query(sql, [id]);
        return rows;
    },

    // Dùng riêng cho lúc đăng nhập để lấy mật khẩu ra so sánh
    getByUsername: async (tendangnhap) => {
        const sql = 'SELECT * FROM taikhoan WHERE tendangnhap = ?';
        const [rows] = await db.query(sql, [tendangnhap]);
        return rows;
    },

    // Kiểm tra tồn tại theo tên đăng nhập (không phân biệt hoa thường)
    existsByUsername: async (tendangnhap) => {
        const sql = 'SELECT 1 FROM taikhoan WHERE LOWER(tendangnhap) = LOWER(?) LIMIT 1';
        const [rows] = await db.query(sql, [tendangnhap]);
        return rows.length > 0;
    },

    // Tạo mới tài khoản (Đã cập nhật role chuẩn: Admin, Kho, Sales)
    create: async (data) => {
        const { tendangnhap, matkhau, vaitro } = data;
        const sql = `INSERT INTO taikhoan (tendangnhap, matkhau, vaitro) VALUES (?, ?, ?)`;
        // Nếu không truyền vai trò, mặc định cấp quyền thấp nhất là Sales
        const [result] = await db.query(sql, [tendangnhap, matkhau, vaitro || 'Sales']);
        return result;
    },

    update: async (id, data) => {
        const { matkhau, vaitro } = data;
        const sql = `UPDATE taikhoan SET matkhau = ?, vaitro = ? WHERE mataikhoan = ?`;
        const [result] = await db.query(sql, [matkhau, vaitro, id]);
        return result;
    },

    delete: async (id) => {
        const sql = 'DELETE FROM taikhoan WHERE mataikhoan = ?';
        const [result] = await db.query(sql, [id]);
        return result;
    }
};

module.exports = taikhoanModel;