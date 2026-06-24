const db = require('../configs/db');

const chitietdonhangModel = {
    // 1. Lấy danh sách chi tiết của MỘT ĐƠN HÀNG (Kèm tên thuốc)
    getByDonHangId: async (madonhang) => {
        const sql = `SELECT ct.*, t.tenthuoc, l.solo
                 FROM chitietdonhang ct
                 LEFT JOIN thuoc t ON ct.mathuoc = t.mathuoc
                 LEFT JOIN lothuoc l ON ct.malo = l.malo
                 WHERE ct.madonhang = ?
                 ORDER BY ct.mactdh ASC`;
        const [rows] = await db.query(sql, [madonhang]);
        return rows;
    },

    // 2. Lấy 1 dòng chi tiết cụ thể (dùng khi cần sửa 1 dòng)
    getById: async (id) => {
        const sql = 'SELECT * FROM chitietdonhang WHERE mactdh = ?';
        const [rows] = await db.query(sql, [id]);
        return rows;
    },

    // 3. Thêm MỚI một dòng chi tiết thuốc vào đơn hàng
    create: async (data) => {
        const {
            madonhang,
            mathuoc,
            malo,
            madonvitinh,
            soluongyeucau,
            soluongthucte,
            dongia,
            phantramchietkhau,
            solo_tam,
            ngaysanxuat_tam,
            hansudung_tam
        } = data;
        const sql = `INSERT INTO chitietdonhang 
                    (madonhang, mathuoc, malo, madonvitinh, soluongyeucau, soluongthucte, dongia, phantramchietkhau, solo_tam, ngaysanxuat_tam, hansudung_tam) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const [result] = await db.query(sql, [
            madonhang, mathuoc, malo || null, madonvitinh, 
            soluongyeucau, soluongthucte || 0, // Mặc định số thực tế ban đầu = 0
            dongia || 0, phantramchietkhau || 0,
            solo_tam || null, ngaysanxuat_tam || null, hansudung_tam || null
        ]);
        return result;
    },

    // 3b. Thêm chi tiết đơn hàng kèm nghiệp vụ nhập/xuất kho
    createWithBusinessLogic: async (data) => {
        const {
            madonhang,
            mathuoc,
            malo,
            madonvitinh,
            soluongyeucau,
            soluongthucte,
            dongia,
            phantramchietkhau,
            hansudung,
            ngaysanxuat,
            ngaynhap,
            solo_tam,
            ngaysanxuat_tam,
            hansudung_tam
        } = data;
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const [donHangRows] = await connection.query(
                'SELECT loaidonhang FROM donhang WHERE madonhang = ? LIMIT 1',
                [madonhang]
            );

            if (donHangRows.length === 0) {
                const error = new Error('Không tìm thấy đơn hàng');
                error.code = 'NOT_FOUND';
                throw error;
            }

            const loaidonhang = String(donHangRows[0].loaidonhang || '').trim().toLowerCase();
            let resolvedMalo = malo;
            const soloTam = solo_tam || malo || null;
            const ngaySanXuatTam = ngaysanxuat_tam || ngaysanxuat || null;
            const hanSuDungTam = hansudung_tam || hansudung || null;

            if (loaidonhang === 'nhap') {
                if (!soloTam) {
                    const error = new Error('Thiếu số lô');
                    error.code = 'BAD_REQUEST';
                    throw error;
                }

                if (!hanSuDungTam || !ngaySanXuatTam) {
                    const error = new Error('Thiếu hạn sử dụng hoặc ngày sản xuất');
                    error.code = 'BAD_REQUEST';
                    throw error;
                }

                resolvedMalo = null;
            }

            if (loaidonhang === 'xuat') {
                const [loRows] = await connection.query(
                    'SELECT tonkhadung, tonthucte, trangthai FROM lothuoc WHERE malo = ? LIMIT 1 FOR UPDATE',
                    [resolvedMalo]
                );

                const [donViRows] = await connection.query(
                    'SELECT hesoquydoi FROM donvitinh WHERE madonvitinh = ? LIMIT 1',
                    [madonvitinh]
                );

                if (loRows.length === 0) {
                    const error = new Error('Không tìm thấy lô thuốc');
                    error.code = 'NOT_FOUND';
                    throw error;
                }

                const tonkhadung = Number(loRows[0].tonkhadung || 0);
                const tonthucte = Number(loRows[0].tonthucte || 0);
                const heSoQuyDoi = Number(donViRows[0]?.hesoquydoi || 0);
                const soLuong = Number(soluongthucte || 0);
                const soLuongQuyDoi = soLuong * heSoQuyDoi;
                const trangthaiLo = String(loRows[0].trangthai || '').trim().toLowerCase();

                if (!heSoQuyDoi || heSoQuyDoi <= 0) {
                    const error = new Error('Đơn vị tính không hợp lệ');
                    error.code = 'BAD_REQUEST';
                    throw error;
                }

                if (trangthaiLo !== 'sansangban') {
                    const error = new Error('Lô thuốc không sẵn sàng bán');
                    error.code = 'BAD_REQUEST';
                    throw error;
                }

                if (soLuong <= 0) {
                    const error = new Error('Số lượng xuất không hợp lệ');
                    error.code = 'BAD_REQUEST';
                    throw error;
                }

                if (tonkhadung - soLuongQuyDoi < 0) {
                    const error = new Error('Tồn khả dụng không đủ');
                    error.code = 'BAD_REQUEST';
                    throw error;
                }

                if (tonkhadung > tonthucte) {
                    const error = new Error('Tồn khả dụng vượt tồn thực tế');
                    error.code = 'BAD_REQUEST';
                    throw error;
                }

                await connection.query(
                    'UPDATE lothuoc SET tonkhadung = tonkhadung - ? WHERE malo = ?',
                    [soLuongQuyDoi, resolvedMalo]
                );
            }

            const [result] = await connection.query(
                `INSERT INTO chitietdonhang 
                (madonhang, mathuoc, malo, madonvitinh, soluongyeucau, soluongthucte, dongia, phantramchietkhau, solo_tam, ngaysanxuat_tam, hansudung_tam) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    madonhang, mathuoc, resolvedMalo, madonvitinh,
                    soluongyeucau, soluongthucte || 0,
                    dongia || 0, phantramchietkhau || 0,
                    loaidonhang === 'nhap' ? soloTam : null,
                    loaidonhang === 'nhap' ? ngaySanXuatTam : null,
                    loaidonhang === 'nhap' ? hanSuDungTam : null
                ]
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

    // 4. Cập nhật chi tiết (Ví dụ: Cập nhật lại số lượng thực tế sau khi đếm hàng)
    update: async (id, data) => {
        const { mathuoc, malo, madonvitinh, soluongyeucau, soluongthucte, dongia, phantramchietkhau } = data;
        const sql = `UPDATE chitietdonhang 
                     SET mathuoc=?, malo=?, madonvitinh=?, soluongyeucau=?, soluongthucte=?, dongia=?, phantramchietkhau=? 
                     WHERE mactdh = ?`;
        const [result] = await db.query(sql, [
            mathuoc, malo, madonvitinh, soluongyeucau, soluongthucte, dongia, phantramchietkhau, id
        ]);
        return result;
    },

    // 5. Xóa 1 dòng chi tiết (Khi khách không muốn mua món này nữa)
    delete: async (id) => {
        const sql = 'DELETE FROM chitietdonhang WHERE mactdh = ?';
        const [result] = await db.query(sql, [id]);
        return result;
    }
};

module.exports = chitietdonhangModel;