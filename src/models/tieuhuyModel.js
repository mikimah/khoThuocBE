const db = require('../configs/db');

const TieuHuyModel = {
    getAll: async () => {
        const sql = `
            SELECT pt.*,
                   nl.tendangnhap AS tennguoilap,
                   nd.tendangnhap AS tennguoiduyet,
                   nc.tendangnhap AS tennguoichungkien
            FROM phieutieuhuy pt
            LEFT JOIN taikhoan nl ON pt.nguoilap = nl.mataikhoan
            LEFT JOIN taikhoan nd ON pt.nguoiduyet = nd.mataikhoan
            LEFT JOIN taikhoan nc ON pt.nguoichungkien = nc.mataikhoan
            ORDER BY pt.ngaylap DESC
        `;
        const [rows] = await db.query(sql);
        return rows;
    },

    getById: async (maphieutieuhuy) => {
        const sql = `
            SELECT pt.*,
                   nl.tendangnhap AS tennguoilap,
                   nd.tendangnhap AS tennguoiduyet,
                   nc.tendangnhap AS tennguoichungkien
            FROM phieutieuhuy pt
            LEFT JOIN taikhoan nl ON pt.nguoilap = nl.mataikhoan
            LEFT JOIN taikhoan nd ON pt.nguoiduyet = nd.mataikhoan
            LEFT JOIN taikhoan nc ON pt.nguoichungkien = nc.mataikhoan
            WHERE pt.maphieutieuhuy = ?
        `;
        const [rows] = await db.query(sql, [maphieutieuhuy]);
        return rows[0];
    },

    getChiTiet: async (maphieutieuhuy) => {
        const sql = `
            SELECT ct.*, lt.solo, lt.hansudung, t.tenthuoc, t.donvicoban AS tendonvitinh
            FROM chitietphieutieuhuy ct
            JOIN lothuoc lt ON ct.malothuoc = lt.malo
            JOIN thuoc t ON lt.mathuoc = t.mathuoc
            WHERE ct.maphieutieuhuy = ?
        `;
        const [rows] = await db.query(sql, [maphieutieuhuy]);
        return rows;
    },

    create: async (data) => {
        const { maphieutieuhuy, maphieukiemke, ngaylap, nguoilap, trangthai } = data;
        const sql = `
            INSERT INTO phieutieuhuy (maphieutieuhuy, maphieukiemke, ngaylap, nguoilap, trangthai)
            VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await db.query(sql, [maphieutieuhuy, maphieukiemke || null, ngaylap || new Date(), nguoilap, trangthai || 'nhap']);
        return result;
    },

    addChiTiet: async (maphieutieuhuy, chiTietArray, maphieukiemke = null) => {
        if (!chiTietArray || chiTietArray.length === 0) return;
        
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();
            
            const sql = `INSERT INTO chitietphieutieuhuy (maphieutieuhuy, malothuoc, soluongtieuhuy) VALUES ?`;
            const values = chiTietArray.map(item => [maphieutieuhuy, item.malothuoc, item.soluongtieuhuy]);
            const [result] = await conn.query(sql, [values]);

            // Trừ Tồn Khả Dụng ngay lúc lập phiếu nháp (chỉ dành cho phiếu lập thủ công)
            // Phiếu từ kiểm kê đã tự trừ khi duyệt kiểm kê rồi
            if (!maphieukiemke) {
                for (const item of chiTietArray) {
                    // Lấy tồn khả dụng hiện tại để kiểm tra
                    const [lo] = await conn.query('SELECT tonkhadung, solo FROM lothuoc WHERE malo = ?', [item.malothuoc]);
                    if (!lo.length) throw new Error('Không tìm thấy lô thuốc');
                    if (lo[0].tonkhadung < item.soluongtieuhuy) {
                        throw new Error(`Lô ${lo[0].solo} không đủ tồn khả dụng (Còn: ${lo[0].tonkhadung})`);
                    }

                    await conn.query(
                        'UPDATE lothuoc SET tonkhadung = tonkhadung - ? WHERE malo = ?',
                        [item.soluongtieuhuy, item.malothuoc]
                    );
                }
            }
            
            await conn.commit();
            return result;
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    },

    update: async (maphieutieuhuy, data) => {
        const { lydo_quyetdinh, thoigian_dukien, phuongtieuhuy, donvi_xuly } = data;
        const sql = `
            UPDATE phieutieuhuy
            SET lydo_quyetdinh = ?, thoigian_dukien = ?, phuongtieuhuy = ?, donvi_xuly = ?, trangthai = 'choduyet'
            WHERE maphieutieuhuy = ?
        `;
        const [result] = await db.query(sql, [lydo_quyetdinh, thoigian_dukien, phuongtieuhuy, donvi_xuly, maphieutieuhuy]);
        return result;
    },

    approve: async (maphieutieuhuy, data) => {
        const { nguoiduyet, nguoichungkien, trangthai } = data; // trangthai = 'daduyet' hoặc 'dahuy'
        
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            const [pt] = await conn.query('SELECT maphieukiemke FROM phieutieuhuy WHERE maphieutieuhuy = ?', [maphieutieuhuy]);
            
            // Nếu Duyệt (Không xuất phát từ Kiểm Kê) -> Phải trừ Tồn Thực Tế
            if (trangthai === 'daduyet') {
                // Nếu maphieukiemke IS NULL -> Phiếu tiêu hủy độc lập -> Cần trừ tồn thực tế
                if (!pt[0].maphieukiemke) {
                    const [chiTietRows] = await conn.query('SELECT * FROM chitietphieutieuhuy WHERE maphieutieuhuy = ?', [maphieutieuhuy]);
                    for (const row of chiTietRows) {
                        // CHỈ Trừ Tồn Thực Tế (Tồn khả dụng đã trừ lúc lập phiếu nháp rồi)
                        await conn.query(
                            'UPDATE lothuoc SET tonthucte = tonthucte - ? WHERE malo = ?',
                            [row.soluongtieuhuy, row.malothuoc]
                        );
                        // Safety Clamp: Đảm bảo tonkhadung không bao giờ vượt tonthucte
                        await conn.query(
                            'UPDATE lothuoc SET tonkhadung = LEAST(tonkhadung, tonthucte) WHERE malo = ? AND tonkhadung > tonthucte',
                            [row.malothuoc]
                        );
                    }
                }
            } else if (trangthai === 'dahuy') {
                // Nếu phiếu thủ công bị hủy -> Hoàn lại Tồn Khả Dụng đã bị giam giữ
                if (!pt[0].maphieukiemke) {
                    const [chiTietRows] = await conn.query('SELECT * FROM chitietphieutieuhuy WHERE maphieutieuhuy = ?', [maphieutieuhuy]);
                    for (const row of chiTietRows) {
                        await conn.query(
                            'UPDATE lothuoc SET tonkhadung = tonkhadung + ? WHERE malo = ?',
                            [row.soluongtieuhuy, row.malothuoc]
                        );
                    }
                }
            }

            const sql = `
                UPDATE phieutieuhuy
                SET nguoiduyet = ?, nguoichungkien = ?, trangthai = ?
                WHERE maphieutieuhuy = ?
            `;
            const [result] = await conn.query(sql, [nguoiduyet, nguoichungkien, trangthai, maphieutieuhuy]);

            await conn.commit();
            return result;
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    },

    delete: async (maphieutieuhuy) => {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            // Nếu là phiếu thủ công, cần hoàn lại Tồn khả dụng trước khi xóa
            const [pt] = await conn.query('SELECT maphieukiemke FROM phieutieuhuy WHERE maphieutieuhuy = ?', [maphieutieuhuy]);
            if (pt.length > 0 && !pt[0].maphieukiemke) {
                const [chiTietRows] = await conn.query('SELECT * FROM chitietphieutieuhuy WHERE maphieutieuhuy = ?', [maphieutieuhuy]);
                for (const row of chiTietRows) {
                    await conn.query(
                        'UPDATE lothuoc SET tonkhadung = tonkhadung + ? WHERE malo = ?',
                        [row.soluongtieuhuy, row.malothuoc]
                    );
                }
            }

            await conn.query('DELETE FROM chitietphieutieuhuy WHERE maphieutieuhuy = ?', [maphieutieuhuy]);
            const [result] = await conn.query('DELETE FROM phieutieuhuy WHERE maphieutieuhuy = ?', [maphieutieuhuy]);
            
            await conn.commit();
            return result;
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }
};

module.exports = TieuHuyModel;
