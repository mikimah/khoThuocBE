const db = require('../configs/db');

const thongkeModel = {
    getTongQuan: async (tuNgay, denNgay, madoitac = null, mathuoc = null) => {
        let params = [tuNgay, denNgay];
        let filterSql = "";

        if (madoitac) {
            filterSql += ` AND dh.madoitac = ?`;
            params.push(madoitac);
        }
        if (mathuoc) {
            filterSql += ` AND ct.mathuoc = ?`;
            params.push(mathuoc);
        }

        const sql = `
            SELECT SUM(CASE WHEN loaidonhang = 'xuat' THEN giatri ELSE 0 END) AS doanhthu,
                   SUM(CASE WHEN loaidonhang = 'nhap' THEN giatri ELSE 0 END) AS tongvon,
                   COUNT(DISTINCT CASE WHEN loaidonhang = 'xuat' THEN madonhang END) AS sodonhang
            FROM (
                SELECT dh.madonhang, dh.loaidonhang, ${mathuoc ? 'ct.soluongthucte * ct.dongia' : 'dh.tonggiatri'} AS giatri
                FROM donhang dh
                ${mathuoc ? 'JOIN chitietdonhang ct ON dh.madonhang = ct.madonhang' : ''}
                WHERE dh.trangthai IN ('daduyet', 'hoanthanh') 
                  AND dh.ngaytao BETWEEN ? AND ?
                  ${filterSql}
            ) raw
        `;

        const [rows] = await db.query(sql, params);
        
        const doanhthu = Number(rows[0]?.doanhthu || 0);
        const tongvon = Number(rows[0]?.tongvon || 0);
        const sodonhang = Number(rows[0]?.sodonhang || 0);
        const loinhuan = doanhthu - tongvon;

        return { doanhthu, tongvon, loinhuan, sodonhang };
    },

    getBieuDo: async (tuNgay, denNgay, madoitac = null, mathuoc = null) => {
        let params = [tuNgay, denNgay];
        let filterSql = "";

        if (madoitac) {
            filterSql += ` AND dh.madoitac = ?`;
            params.push(madoitac);
        }
        if (mathuoc) {
            filterSql += ` AND ct.mathuoc = ?`;
            params.push(mathuoc);
        }

        const sql = `
            SELECT DATE(ngaytao) as ngay,
                   SUM(CASE WHEN loaidonhang = 'xuat' THEN giatri ELSE 0 END) AS doanhthu,
                   SUM(CASE WHEN loaidonhang = 'nhap' THEN giatri ELSE 0 END) AS tongvon,
                   SUM(CASE WHEN loaidonhang = 'xuat' THEN giatri ELSE 0 END) - SUM(CASE WHEN loaidonhang = 'nhap' THEN giatri ELSE 0 END) AS loinhuan
            FROM (
                SELECT dh.ngaytao, dh.loaidonhang, ${mathuoc ? 'ct.soluongthucte * ct.dongia' : 'dh.tonggiatri'} AS giatri
                FROM donhang dh
                ${mathuoc ? 'JOIN chitietdonhang ct ON dh.madonhang = ct.madonhang' : ''}
                WHERE dh.trangthai IN ('daduyet', 'hoanthanh') 
                  AND dh.ngaytao BETWEEN ? AND ?
                  ${filterSql}
            ) raw
            GROUP BY DATE(ngaytao)
            ORDER BY DATE(ngaytao) ASC
        `;

        const [rows] = await db.query(sql, params);
        return rows;
    },

    getChiTiet: async (tuNgay, denNgay, madoitac = null, mathuoc = null) => {
        let params = [tuNgay, denNgay];
        let filterSql = "";

        if (madoitac) {
            filterSql += ` AND dh.madoitac = ?`;
            params.push(madoitac);
        }
        if (mathuoc) {
            filterSql += ` AND ct.mathuoc = ?`;
            params.push(mathuoc);
        }

        const sql = `
            SELECT dh.madonhang, dh.ngaytao, dh.loaidonhang, dt.tendoitac, dh.trangthai,
                   ${mathuoc ? 'ct.soluongthucte * ct.dongia' : 'dh.tonggiatri'} AS giatri
            FROM donhang dh
            LEFT JOIN doitac dt ON dh.madoitac = dt.madoitac
            ${mathuoc ? 'JOIN chitietdonhang ct ON dh.madonhang = ct.madonhang' : ''}
            WHERE dh.trangthai IN ('daduyet', 'hoanthanh') 
              AND dh.ngaytao BETWEEN ? AND ?
              ${filterSql}
            ORDER BY dh.ngaytao DESC
            LIMIT 50
        `;

        const [rows] = await db.query(sql, params);
        return rows;
    }
};

module.exports = thongkeModel;
