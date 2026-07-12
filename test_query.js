const db = require('./src/configs/db');
(async () => {
  const [rows] = await db.query(`
    SELECT SUM(ct.soluongthucte * COALESCE(dv.hesoquydoi, 1) * COALESCE(gia.gianhap, 0)) AS tongvon
    FROM donhang dh
    JOIN chitietdonhang ct ON dh.madonhang = ct.madonhang
    LEFT JOIN donvitinh dv ON ct.madonvitinh = dv.madonvitinh
    LEFT JOIN lothuoc l ON ct.malo = l.malo
    LEFT JOIN (
        SELECT ct_in.mathuoc, ct_in.solo_tam, MAX(ct_in.dongia) as gianhap
        FROM chitietdonhang ct_in
        JOIN donhang dh_in ON ct_in.madonhang = dh_in.madonhang
        WHERE dh_in.loaidonhang = 'nhap'
        GROUP BY ct_in.mathuoc, ct_in.solo_tam
    ) gia ON gia.mathuoc = l.mathuoc AND gia.solo_tam = l.solo
    WHERE dh.loaidonhang = 'xuat' AND dh.trangthai IN ('daduyet', 'hoanthanh')
  `);
  console.log(rows);
  process.exit(0);
})();
