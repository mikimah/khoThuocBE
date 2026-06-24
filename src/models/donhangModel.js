const db = require('../configs/db');

const donhangModel = {
    // 1. Lấy tất cả đơn hàng (Kèm tên đối tác + tên tài khoản)
    getAll: async () => {
        const sql = `SELECT dh.*, dt.tendoitac, tk.tendangnhap 
                     FROM donhang dh 
                     LEFT JOIN doitac dt ON dh.madoitac = dt.madoitac 
                     LEFT JOIN taikhoan tk ON dh.mataikhoan = tk.mataikhoan
                     ORDER BY dh.ngaytao DESC`;
        const [rows] = await db.query(sql);
        return rows;
    },

    // 2. Lấy chi tiết 1 đơn hàng theo ID
    getById: async (id) => {
        const sql = `SELECT dh.*, dt.tendoitac, tk.tendangnhap 
                     FROM donhang dh 
                     LEFT JOIN doitac dt ON dh.madoitac = dt.madoitac 
                     LEFT JOIN taikhoan tk ON dh.mataikhoan = tk.mataikhoan
                     WHERE dh.madonhang = ?`;
        const [rows] = await db.query(sql, [id]);
        return rows;
    },

    // 2b. Tra cứu đơn hàng công khai theo mã vận đơn hoặc số điện thoại
    getPublicByTrackingOrPhone: async (mavandon3pl, sodienthoai) => {
        const sql = `SELECT dh.madonhang, dh.ngaytao, dh.trangthai, dh.mavandon3pl, dh.tonggiatri, dh.tiendathanhtoan, dt.tendoitac
                     FROM donhang dh
                     LEFT JOIN doitac dt ON dh.madoitac = dt.madoitac
                     WHERE (
                            (? IS NOT NULL AND dh.mavandon3pl = ?)
                            OR
                            (? IS NOT NULL AND dt.sodienthoai = ?)
                           )
                     ORDER BY dh.ngaytao DESC
                     LIMIT 1`;
        const trackingVal = mavandon3pl || null;
        const phoneVal = sodienthoai || null;
        const [rows] = await db.query(sql, [trackingVal, trackingVal, phoneVal, phoneVal]);
        return rows;
    },

    // 2c. Tra chi tiết đơn hàng công khai (ẩn dữ liệu nhạy cảm)
    getPublicDetails: async (madonhang) => {
        const sql = `SELECT t.tenthuoc, ct.soluongthucte, ct.dongia,
                            (ct.soluongthucte * ct.dongia) AS thanhtien
                     FROM chitietdonhang ct
                     LEFT JOIN thuoc t ON ct.mathuoc = t.mathuoc
                     WHERE ct.madonhang = ?
                     ORDER BY ct.mactdh ASC`;
        const [rows] = await db.query(sql, [madonhang]);
        return rows;
    },

    // 3. Lọc đơn hàng theo Loại (Nhap / Xuat)
    getByLoai: async (loaidonhang) => {
        const sql = `SELECT dh.*, dt.tendoitac, tk.tendangnhap 
                     FROM donhang dh 
                     LEFT JOIN doitac dt ON dh.madoitac = dt.madoitac 
                     LEFT JOIN taikhoan tk ON dh.mataikhoan = tk.mataikhoan
                     WHERE dh.loaidonhang = ? 
                     ORDER BY dh.ngaytao DESC`;
        const [rows] = await db.query(sql, [loaidonhang]);
        return rows;
    },

    // 4. Tạo đơn hàng mới
    create: async (data) => {
        const { madoitac, mataikhoan, loaidonhang, sohoadongtgt, mavandon3pl, trangthai, tonggiatri, tienchietkhau, tiendathanhtoan } = data;
        
        // Nếu không truyền ngày tạo, tự động lấy ngày giờ hiện tại của server
        const ngaytao = data.ngaytao || new Date().toISOString().slice(0, 19).replace('T', ' ');

        const sql = `INSERT INTO donhang 
                    (madoitac, mataikhoan, loaidonhang, sohoadongtgt, mavandon3pl, trangthai, ngaytao, tonggiatri, tienchietkhau, tiendathanhtoan) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const [result] = await db.query(sql, [
            madoitac, mataikhoan, loaidonhang, 
            sohoadongtgt || null, mavandon3pl || null, 
            trangthai || 'choduyet', ngaytao, 
            tonggiatri || 0, tienchietkhau || 0, tiendathanhtoan || 0
        ]);
        return result;
    },

    // 5. Cập nhật TRẠNG THÁI đơn hàng (Riêng biệt để an toàn)
    updateStatus: async (id, trangthai) => {
        const sql = `UPDATE donhang SET trangthai = ? WHERE madonhang = ?`;
        const [result] = await db.query(sql, [trangthai, id]);
        return result;
    },

    // 5b. Cập nhật trạng thái + xử lý công nợ, tồn kho (transaction)
    updateStatusWithBusinessLogic: async (id, trangthai) => {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            if (trangthai === 'daduyet') {
                const [donHangs] = await connection.query(
                    `SELECT loaidonhang, madoitac, tonggiatri, tiendathanhtoan
                     FROM donhang WHERE madonhang = ?`,
                    [id]
                );

                if (donHangs.length === 0) {
                    const error = new Error('Không tìm thấy đơn hàng');
                    error.code = 'NOT_FOUND';
                    throw error;
                }

                const donHang = donHangs[0];
                const loaiDon = String(donHang.loaidonhang || '').trim().toLowerCase();
                const tienNo = Number(donHang.tonggiatri) - Number(donHang.tiendathanhtoan || 0);

                if (tienNo > 0) {
                    await connection.query(
                        `UPDATE doitac
                         SET tongnohientai = tongnohientai + ?,
                             solangiaodich_thanhcong = solangiaodich_thanhcong + 1
                         WHERE madoitac = ?`,
                        [tienNo, donHang.madoitac]
                    );
                } else {
                    await connection.query(
                        `UPDATE doitac
                         SET solangiaodich_thanhcong = solangiaodich_thanhcong + 1
                         WHERE madoitac = ?`,
                        [donHang.madoitac]
                    );
                }

                if (loaiDon === 'xuat') {
                    const [chiTiet] = await connection.query(
                        `SELECT malo, soluongthucte, madonvitinh FROM chitietdonhang WHERE madonhang = ?`,
                        [id]
                    );

                    for (const item of chiTiet) {
                        const [donViRows] = await connection.query(
                            'SELECT hesoquydoi FROM donvitinh WHERE madonvitinh = ? LIMIT 1',
                            [item.madonvitinh]
                        );
                        const heSoQuyDoi = Number(donViRows[0]?.hesoquydoi || 0);
                        if (!heSoQuyDoi || heSoQuyDoi <= 0) {
                            const error = new Error('Đơn vị tính không hợp lệ');
                            error.code = 'BAD_REQUEST';
                            throw error;
                        }
                        const soLuongQuyDoi = Number(item.soluongthucte || 0) * heSoQuyDoi;
                        await connection.query(
                            `UPDATE lothuoc
                             SET tonthucte = tonthucte - ?
                             WHERE malo = ?`,
                            [soLuongQuyDoi, item.malo]
                        );
                    }
                } else if (loaiDon === 'nhap') {
                    const [chiTietNhap] = await connection.query(
                        `SELECT mactdh, mathuoc, soluongthucte, madonvitinh, solo_tam, ngaysanxuat_tam, hansudung_tam
                         FROM chitietdonhang WHERE madonhang = ?`,
                        [id]
                    );

                    for (const item of chiTietNhap) {
                        const [donViRows] = await connection.query(
                            'SELECT hesoquydoi FROM donvitinh WHERE madonvitinh = ? LIMIT 1',
                            [item.madonvitinh]
                        );
                        const heSoQuyDoi = Number(donViRows[0]?.hesoquydoi || 0);
                        if (!heSoQuyDoi || heSoQuyDoi <= 0) {
                            const error = new Error('Đơn vị tính không hợp lệ');
                            error.code = 'BAD_REQUEST';
                            throw error;
                        }
                        const soLuongNhapKho = Number(item.soluongthucte || 0) * heSoQuyDoi;
                        const [insertLo] = await connection.query(
                            `INSERT INTO lothuoc (solo, mathuoc, tonthucte, tonkhadung, ngaysanxuat, hansudung, trangthai)
                             VALUES (?, ?, ?, ?, ?, ?, ?)` ,
                            [
                                item.solo_tam,
                                item.mathuoc,
                                soLuongNhapKho,
                                soLuongNhapKho,
                                item.ngaysanxuat_tam,
                                item.hansudung_tam,
                                'biettru'
                            ]
                        );

                        await connection.query(
                            `UPDATE chitietdonhang SET malo = ? WHERE mactdh = ?`,
                            [insertLo.insertId, item.mactdh]
                        );
                    }
                }
            }

            if (trangthai === 'huy') {
                const [donHangRows] = await connection.query(
                    `SELECT loaidonhang FROM donhang WHERE madonhang = ?`,
                    [id]
                );

                if (donHangRows.length > 0 && String(donHangRows[0].loaidonhang || '').trim().toLowerCase() === 'xuat') {
                    const [chiTietHuy] = await connection.query(
                        `SELECT malo, soluongthucte, madonvitinh FROM chitietdonhang WHERE madonhang = ?`,
                        [id]
                    );

                    for (const item of chiTietHuy) {
                        const [donViRows] = await connection.query(
                            'SELECT hesoquydoi FROM donvitinh WHERE madonvitinh = ? LIMIT 1',
                            [item.madonvitinh]
                        );
                        const heSoQuyDoi = Number(donViRows[0]?.hesoquydoi || 0);
                        if (!heSoQuyDoi || heSoQuyDoi <= 0) {
                            const error = new Error('Đơn vị tính không hợp lệ');
                            error.code = 'BAD_REQUEST';
                            throw error;
                        }
                        const soLuongQuyDoi = Number(item.soluongthucte || 0) * heSoQuyDoi;
                        await connection.query(
                            `UPDATE lothuoc
                             SET tonkhadung = tonkhadung + ?
                             WHERE malo = ?`,
                            [soLuongQuyDoi, item.malo]
                        );
                    }
                }
            }

            const [result] = await connection.query(
                `UPDATE donhang SET trangthai = ? WHERE madonhang = ?`,
                [trangthai, id]
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

    // 6. Cập nhật toàn bộ thông tin đơn hàng (Chỉ nên cho phép khi đang 'choduyet')
    update: async (id, data) => {
        const { madoitac, sohoadongtgt, mavandon3pl, tonggiatri, tienchietkhau, tiendathanhtoan } = data;
        const sql = `UPDATE donhang 
                     SET madoitac=?, sohoadongtgt=?, mavandon3pl=?, tonggiatri=?, tienchietkhau=?, tiendathanhtoan=? 
                     WHERE madonhang = ?`;
        const [result] = await db.query(sql, [madoitac, sohoadongtgt, mavandon3pl, tonggiatri, tienchietkhau, tiendathanhtoan, id]);
        return result;
    },

    // 7. Xóa đơn hàng (Thực tế ít dùng, thường dùng Hủy đơn)
    delete: async (id) => {
        const sql = 'DELETE FROM donhang WHERE madonhang = ?';
        const [result] = await db.query(sql, [id]);
        return result;
    }
};

module.exports = donhangModel;