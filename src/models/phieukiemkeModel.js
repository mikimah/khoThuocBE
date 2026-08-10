const db = require('../configs/db');

const phieukiemkeModel = {
    getAll: async () => {
        const sql = 'SELECT * FROM phieukiemke ORDER BY ngaykiemke DESC';
        const [rows] = await db.query(sql);
        return rows;
    },
    
    getById: async (maphieu) => {
        const sql = 'SELECT * FROM phieukiemke WHERE maphieu = ?';
        const [rows] = await db.query(sql, [maphieu]);
        return rows;
    },
    
    create: async (data) => {
        const { maphieu, ngaykiemke, nguoitao, trangthai } = data;
        const sql = `INSERT INTO phieukiemke (maphieu, ngaykiemke, nguoitao, trangthai) VALUES (?, ?, ?, ?)`;
        const [result] = await db.query(sql, [maphieu, ngaykiemke || new Date(), nguoitao, trangthai || 'dangkiemke']);
        return result;
    },
    
    updateTrangThai: async (maphieu, trangthai) => {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            if (trangthai === 'hoanthanh') {
                const [chiTietRows] = await conn.query('SELECT * FROM chitietkiemke WHERE maphieu = ?', [maphieu]);

                let tieuHuyChiTiet = [];

                for (const row of chiTietRows) {
                    const soLuongLech = Number(row.soluong_lech) || 0;
                    if (soLuongLech === 0) continue;

                    // Toán học bảo vệ CSDL: Nếu hụt hàng (Dương) -> Trừ kho. Nếu dư hàng (Âm) -> Trừ đi số âm thành Cộng kho.
                    await conn.query(
                        'UPDATE lothuoc SET tonthucte = tonthucte - ?, tonkhadung = tonkhadung - ? WHERE malo = ?',
                        [soLuongLech, soLuongLech, row.malo]
                    );
                    // Safety Clamp: Chặn tonkhadung âm và không cho vượt tonthucte
                    await conn.query(
                        'UPDATE lothuoc SET tonkhadung = GREATEST(0, LEAST(tonkhadung, tonthucte)) WHERE malo = ?',
                        [row.malo]
                    );

                    // Auto-Spawn logic: Kiểm tra lý do để đưa vào phiếu tiêu hủy (chỉ áp dụng khi hao hụt > 0)
                    if (soLuongLech > 0 && row.lydo) {
                        const lowerLydo = row.lydo.toLowerCase();
                        if (lowerLydo.includes('hư hỏng') || lowerLydo.includes('vỡ') || lowerLydo.includes('hết hạn') || lowerLydo.includes('móp méo') || lowerLydo.includes('rách')) {
                            tieuHuyChiTiet.push([
                                `TH${Date.now()}`, // Sẽ được cập nhật lại với mã phiếu thực tế
                                row.malo,
                                soLuongLech
                            ]);
                        }
                    }
                }

                // Nếu có dòng nào cần tiêu hủy, tự động tạo Phiếu Tiêu Hủy nháp
                if (tieuHuyChiTiet.length > 0) {
                    const maPhieuTieuHuy = `TH${Date.now()}`; // Tạo mã phiếu tiêu hủy tự động
                    
                    // Lấy nguoitao từ bảng phieukiemke để làm nguoilap cho phieutieuhuy
                    const [pk] = await conn.query('SELECT nguoitao FROM phieukiemke WHERE maphieu = ?', [maphieu]);
                    const nguoitao = pk[0]?.nguoitao || 1;

                    // Tạo phiếu tiêu hủy nháp
                    await conn.query(
                        `INSERT INTO phieutieuhuy (maphieutieuhuy, maphieukiemke, ngaylap, nguoilap, trangthai)
                         VALUES (?, ?, ?, ?, 'nhap')`,
                        [maPhieuTieuHuy, maphieu, new Date(), nguoitao]
                    );

                    // Cập nhật lại mã phiếu cho mảng chi tiết và Insert
                    const values = tieuHuyChiTiet.map(item => [maPhieuTieuHuy, item[1], item[2]]);
                    await conn.query(
                        `INSERT INTO chitietphieutieuhuy (maphieutieuhuy, malothuoc, soluongtieuhuy) VALUES ?`,
                        [values]
                    );
                }
            }

            const [result] = await conn.query('UPDATE phieukiemke SET trangthai = ? WHERE maphieu = ?', [trangthai, maphieu]);

            await conn.commit();
            return result;
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    },
    
    delete: async (maphieu) => {
        const sql = 'DELETE FROM phieukiemke WHERE maphieu = ?';
        const [result] = await db.query(sql, [maphieu]);
        return result;
    }
};

module.exports = phieukiemkeModel;