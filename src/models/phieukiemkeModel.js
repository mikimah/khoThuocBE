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
        const [result] = await db.query(sql, [maphieu, ngaykiemke || new Date(), nguoitao, trangthai || 'Draft']);
        return result;
    },
    updateTrangThai: async (maphieu, trangthai) => {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            if (trangthai === 'hoanthanh') {
                const [chiTietRows] = await conn.query(
                    'SELECT * FROM chitietkiemke WHERE maphieu = ?',
                    [maphieu]
                );

                for (const row of chiTietRows) {
                    const soLuongTru = Number(row.soluong_tru) || 0;
                    if (soLuongTru === 0) continue;

                    await conn.query(
                        'UPDATE lothuoc SET tonthucte = tonthucte - ?, tonkhadung = tonkhadung - ? WHERE malo = ?',
                        [soLuongTru, soLuongTru, row.malo]
                    );
                }
            }

            const [result] = await conn.query(
                'UPDATE phieukiemke SET trangthai = ? WHERE maphieu = ?',
                [trangthai, maphieu]
            );

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