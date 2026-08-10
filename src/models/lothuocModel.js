const db = require('../configs/db');

const LoThuocModel = {
    // 1. Lấy tất cả lô thuốc (kèm tên thuốc và giá nhập gần nhất)
    getAll: async () => {
        await db.query(`UPDATE lothuoc SET trangthai = 'khoalo' WHERE hansudung < CURDATE() AND trangthai != 'khoalo'`);
        // Auto-fix: Kẹp tonkhadung không vượt tonthucte (sửa dữ liệu bẩn nếu có)
        await db.query(`UPDATE lothuoc SET tonkhadung = LEAST(tonkhadung, tonthucte) WHERE tonkhadung > tonthucte`);
        const sql = `SELECT l.*, t.tenthuoc,
                        (SELECT ct.dongia FROM chitietdonhang ct
                         JOIN donhang dh ON ct.madonhang = dh.madonhang
                         WHERE (ct.malo = l.malo OR (ct.mathuoc = l.mathuoc AND ct.solo_tam = l.solo))
                           AND dh.loaidonhang = 'nhap'
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
             WHERE (ct.malo = l.malo OR (ct.mathuoc = l.mathuoc AND ct.solo_tam = l.solo))
               AND dh.loaidonhang = 'nhap' 
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
    },

    // 6. Tách lô (Split Lot)
    splitLo: async (malo, soluong_tach) => {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            // Lấy thông tin lô gốc
            const [rows] = await conn.query('SELECT * FROM lothuoc WHERE malo = ? FOR UPDATE', [malo]);
            if (rows.length === 0) throw new Error('Không tìm thấy lô gốc!');
            const loGoc = rows[0];

            if (soluong_tach <= 0) throw new Error('Số lượng tách phải lớn hơn 0');
            if (soluong_tach > loGoc.tonkhadung) {
                throw new Error('Số lượng tách không được lớn hơn Tồn khả dụng hiện tại!');
            }

            // Trừ số lượng ở lô gốc (tonthucte và tonkhadung đều trừ)
            await conn.query(
                'UPDATE lothuoc SET tonthucte = tonthucte - ?, tonkhadung = tonkhadung - ? WHERE malo = ?',
                [soluong_tach, soluong_tach, malo]
            );

            // Chèn lô mới (kế thừa y nguyên nhưng mavitri = NULL, trangthai = 'biettru')
            const insertSql = `INSERT INTO lothuoc 
                               (solo, mathuoc, tonthucte, tonkhadung, hansudung, ngaysanxuat, ngaynhap, mavitri, trangthai) 
                               VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 'biettru')`;
            await conn.query(insertSql, [
                loGoc.solo, loGoc.mathuoc, soluong_tach, soluong_tach,
                loGoc.hansudung, loGoc.ngaysanxuat, loGoc.ngaynhap
            ]);

            await conn.commit();
            return { success: true };
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }
};

module.exports = LoThuocModel;