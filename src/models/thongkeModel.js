const db = require('../configs/db');

const thongkeModel = {
    getTongQuan: async (tuNgay, denNgay) => {
        const [doanhThuRows] = await db.query(
            `SELECT SUM(tonggiatri) AS doanhthu, COUNT(madonhang) AS sodonhang
             FROM donhang
             WHERE loaidonhang = 'xuat'
               AND trangthai IN ('daduyet', 'hoanthanh')
               AND ngaytao BETWEEN ? AND ?`,
            [tuNgay, denNgay]
        );

        const [vonRows] = await db.query(
          `SELECT SUM(ct.soluongthucte * COALESCE(dv.hesoquydoi, 1) * COALESCE(gia.gianhapgannhat, 0)) AS tongvon
           FROM donhang dh
           JOIN chitietdonhang ct ON dh.madonhang = ct.madonhang
           LEFT JOIN donvitinh dv ON ct.madonvitinh = dv.madonvitinh
           LEFT JOIN (
            SELECT ctg.malo, ctg.dongia AS gianhapgannhat
            FROM chitietdonhang ctg
            JOIN donhang dhg ON ctg.madonhang = dhg.madonhang
            JOIN (
              SELECT ct2.malo, MAX(dh2.ngaytao) AS maxngay
              FROM chitietdonhang ct2
              JOIN donhang dh2 ON ct2.madonhang = dh2.madonhang
              WHERE dh2.loaidonhang = 'nhap'
              GROUP BY ct2.malo
            ) latest ON latest.malo = ctg.malo AND dhg.ngaytao = latest.maxngay
            WHERE dhg.loaidonhang = 'nhap'
           ) gia ON gia.malo = ct.malo
           WHERE dh.loaidonhang = 'xuat'
             AND dh.trangthai IN ('daduyet', 'hoanthanh')
             AND dh.ngaytao BETWEEN ? AND ?`,
          [tuNgay, denNgay]
        );

        const doanhthu = Number(doanhThuRows[0]?.doanhthu || 0);
        const sodonhang = Number(doanhThuRows[0]?.sodonhang || 0);
        const tongvon = Number(vonRows[0]?.tongvon || 0);
        const loinhuan = doanhthu - tongvon;

        return { doanhthu, tongvon, loinhuan, sodonhang };
    },

    getBieuDo: async (tuNgay, denNgay) => {
        const sql = `SELECT d.ngay, d.doanhthu,
                            (d.doanhthu - IFNULL(c.tongvon, 0)) AS loinhuan
                     FROM (
                         SELECT DATE(ngaytao) AS ngay, SUM(tonggiatri) AS doanhthu
                         FROM donhang
                         WHERE loaidonhang = 'xuat'
                           AND trangthai IN ('daduyet', 'hoanthanh')
                           AND ngaytao BETWEEN ? AND ?
                         GROUP BY DATE(ngaytao)
                     ) d
                     LEFT JOIN (
                         SELECT DATE(dh.ngaytao) AS ngay,
                                SUM(ct.soluongthucte * COALESCE(dv.hesoquydoi, 1) * COALESCE(gia.gianhapgannhat, 0)) AS tongvon
                         FROM donhang dh
                         JOIN chitietdonhang ct ON dh.madonhang = ct.madonhang
                         LEFT JOIN donvitinh dv ON ct.madonvitinh = dv.madonvitinh
                         LEFT JOIN (
                            SELECT ctg.malo, ctg.dongia AS gianhapgannhat
                            FROM chitietdonhang ctg
                            JOIN donhang dhg ON ctg.madonhang = dhg.madonhang
                            JOIN (
                                SELECT ct2.malo, MAX(dh2.ngaytao) AS maxngay
                                FROM chitietdonhang ct2
                                JOIN donhang dh2 ON ct2.madonhang = dh2.madonhang
                                WHERE dh2.loaidonhang = 'nhap'
                                GROUP BY ct2.malo
                            ) latest ON latest.malo = ctg.malo AND dhg.ngaytao = latest.maxngay
                            WHERE dhg.loaidonhang = 'nhap'
                         ) gia ON gia.malo = ct.malo
                         WHERE dh.loaidonhang = 'xuat'
                           AND dh.trangthai IN ('daduyet', 'hoanthanh')
                           AND dh.ngaytao BETWEEN ? AND ?
                         GROUP BY DATE(dh.ngaytao)
                     ) c ON d.ngay = c.ngay
                     ORDER BY d.ngay ASC`;

        const [rows] = await db.query(sql, [tuNgay, denNgay, tuNgay, denNgay]);
        return rows;
    },

    getTopThuoc: async (tuNgay, denNgay, limit = 5) => {
        const sql = `SELECT ct.mathuoc, t.tenthuoc,
                            SUM(ct.soluongthucte * COALESCE(dv.hesoquydoi, 1)) AS tongsoluong,
                            SUM(ct.soluongthucte * ct.dongia) AS doanhthu
                     FROM donhang dh
                     JOIN chitietdonhang ct ON dh.madonhang = ct.madonhang
                     LEFT JOIN donvitinh dv ON ct.madonvitinh = dv.madonvitinh
                     LEFT JOIN thuoc t ON ct.mathuoc = t.mathuoc
                     WHERE dh.loaidonhang = 'xuat'
                       AND dh.trangthai IN ('daduyet', 'hoanthanh')
                       AND dh.ngaytao BETWEEN ? AND ?
                     GROUP BY ct.mathuoc, t.tenthuoc
                     ORDER BY doanhthu DESC
                     LIMIT ?`;

        const [rows] = await db.query(sql, [tuNgay, denNgay, limit]);
        return rows;
    }
};

module.exports = thongkeModel;
