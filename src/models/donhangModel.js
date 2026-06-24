const db = require('../configs/db');

const donhangModel = {
    getAll: async () => {
        const sql = `SELECT dh.*, dt.tendoitac, tk.tendangnhap 
                     FROM donhang dh 
                     LEFT JOIN doitac dt ON dh.madoitac = dt.madoitac 
                     LEFT JOIN taikhoan tk ON dh.mataikhoan = tk.mataikhoan
                     ORDER BY dh.ngaytao DESC`;
        const [rows] = await db.query(sql);
        return rows;
    },

    getById: async (id) => {
        const sql = `SELECT dh.*, dt.tendoitac, tk.tendangnhap 
                     FROM donhang dh 
                     LEFT JOIN doitac dt ON dh.madoitac = dt.madoitac 
                     LEFT JOIN taikhoan tk ON dh.mataikhoan = tk.mataikhoan
                     WHERE dh.madonhang = ?`;
        const [rows] = await db.query(sql, [id]);
        return rows;
    },

    getPublicByTrackingOrPhone: async (mavandon3pl, sodienthoai) => {
        const sql = `SELECT dh.madonhang, dh.mavandon3pl, dh.tonggiatri, dh.trangthai, dh.ngaytao,
                            dt.tendoitac, dt.sodienthoai, dt.diachi
                     FROM donhang dh
                     JOIN doitac dt ON dh.madoitac = dt.madoitac
                     WHERE (? IS NOT NULL AND dh.mavandon3pl = ?)
                        OR (? IS NOT NULL AND dt.sodienthoai = ?)
                     LIMIT 1`;
        const [rows] = await db.query(sql, [mavandon3pl, mavandon3pl, sodienthoai, sodienthoai]);
        return rows;
    },

    getPublicDetails: async (madonhang) => {
        const sql = `SELECT ct.soluongthucte, ct.dongia, t.tenthuoc, dv.tendonvi, l.solo
                     FROM chitietdonhang ct
                     JOIN thuoc t ON ct.mathuoc = t.mathuoc
                     LEFT JOIN donvitinh dv ON ct.madonvitinh = dv.madonvitinh
                     LEFT JOIN lothuoc l ON ct.malo = l.malo
                     WHERE ct.madonhang = ?`;
        const [rows] = await db.query(sql, [madonhang]);
        return rows;
    },

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

    create: async (data) => {
        const { madoitac, mataikhoan, loaidonhang, sohoadongtgt, mavandon3pl, tonggiatri, tienchietkhau, tiendathanhtoan } = data;
        const sql = `INSERT INTO donhang (madoitac, mataikhoan, loaidonhang, sohoadongtgt, mavandon3pl, trangthai, tonggiatri, tienchietkhau, tiendathanhtoan) 
                     VALUES (?, ?, ?, ?, ?, 'choduyet', ?, ?, ?)`;
        const [result] = await db.query(sql, [
            madoitac, mataikhoan, loaidonhang, sohoadongtgt, mavandon3pl,
            tonggiatri || 0, tienchietkhau || 0, tiendathanhtoan || 0
        ]);
        return result;
    },

    // QUAY VỀ LOGIC CŨ: Trừ kho trực tiếp theo mã lô được chỉ định ở chi tiết đơn hàng
    updateStatusWithBusinessLogic: async (id, trangthai) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Lấy trạng thái hiện tại của đơn hàng
            const [dhRows] = await connection.query('SELECT loaidonhang, trangthai FROM donhang WHERE madonhang = ?', [id]);
            if (dhRows.length === 0) throw new Error('Không tìm thấy đơn hàng');
            const donHang = dhRows[0];

            // KỊCH BẢN 1: DUYỆT ĐƠN XUẤT HÀNG -> Trừ trực tiếp vào lô được chọn trên đơn
            if (donHang.loaidonhang === 'xuat' && trangthai === 'daduyet' && donHang.trangthai === 'choduyet') {
                const [chiTiet] = await connection.query(
                    `SELECT malo, soluongthucte, madonvitinh, mathuoc FROM chitietdonhang WHERE madonhang = ?`, 
                    [id]
                );

                for (const item of chiTiet) {
                    if (!item.malo) {
                        throw new Error(`Thuốc ID ${item.mathuoc} chưa được gán mã lô xuất, không thể duyệt đơn!`);
                    }

                    // Quy đổi số lượng theo đơn vị tính nếu cần
                    const [donViRows] = await connection.query('SELECT hesoquydoi FROM donvitinh WHERE madonvitinh = ? LIMIT 1', [item.madonvitinh]);
                    const heSoQuyDoi = Number(donViRows[0]?.hesoquydoi || 1);
                    const soLuongTruVatLy = Number(item.soluongthucte || 0) * heSoQuyDoi;

                    // Kiểm tra xem lô đó có đủ hàng không
                    const [loRows] = await connection.query('SELECT tonthucte FROM lothuoc WHERE malo = ?', [item.malo]);
                    if (loRows.length === 0) throw new Error(`Không tìm thấy mã lô ${item.malo}`);
                    
                    if (loRows[0].tonthucte < soLuongTruVatLy) {
                        throw new Error(`Lô ID ${item.malo} không đủ số lượng tồn vật lý để xuất hàng!`);
                    }

                    // Tiến hành trừ thẳng vào lô được chọn
                    await connection.query(
                        `UPDATE lothuoc SET tonthucte = tonthucte - ? WHERE malo = ?`,
                        [soLuongTruVatLy, item.malo]
                    );
                }
            }

            // KỊCH BẢN 2: HỦY ĐƠN XUẤT -> Hoàn lại kho khả dụng cho lô đã đặt trước
            if (donHang.loaidonhang === 'xuat' && trangthai === 'huy' && donHang.trangthai === 'choduyet') {
                const [chiTiet] = await connection.query(`SELECT malo, soluongyeucau, madonvitinh FROM chitietdonhang WHERE madonhang = ?`, [id]);
                for (const item of chiTiet) {
                    if (item.malo) {
                        const [donViRows] = await connection.query('SELECT hesoquydoi FROM donvitinh WHERE madonvitinh = ? LIMIT 1', [item.madonvitinh]);
                        const heSoQuyDoi = Number(donViRows[0]?.hesoquydoi || 1);
                        const soLuongQuyDoi = Number(item.soluongyeucau || 0) * heSoQuyDoi;
                        
                        await connection.query(
                            `UPDATE lothuoc SET tonkhadung = tonkhadung + ? WHERE malo = ?`,
                            [soLuongQuyDoi, item.malo]
                        );
                    }
                }
            }

            // Cập nhật trạng thái cuối cùng của đơn hàng
            const [result] = await connection.query(`UPDATE donhang SET trangthai = ? WHERE madonhang = ?`, [trangthai, id]);
            
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    update: async (id, data) => {
        const { madoitac, sohoadongtgt, mavandon3pl, tonggiatri, tienchietkhau, tiendathanhtoan } = data;
        const sql = `UPDATE donhang 
                     SET madoitac=?, sohoadongtgt=?, mavandon3pl=?, tonggiatri=?, tienchietkhau=?, tiendathanhtoan=? 
                     WHERE madonhang = ?`;
        const [result] = await db.query(sql, [madoitac, sohoadongtgt, mavandon3pl, tonggiatri, tienchietkhau, tiendathanhtoan, id]);
        return result;
    },

    delete: async (id) => {
        const sql = 'DELETE FROM donhang WHERE madonhang = ?';
        const [result] = await db.query(sql, [id]);
        return result;
    }
};

module.exports = donhangModel;