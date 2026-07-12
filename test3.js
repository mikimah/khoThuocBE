const db = require('./src/configs/db');
(async () => {
  const [rows] = await db.query(`
    SELECT dh.madonhang, ct.soluongthucte, dv.hesoquydoi, gia.gianhap_per_base,
           (ct.soluongthucte * COALESCE(dv.hesoquydoi, 1) * COALESCE(gia.gianhap_per_base, 0)) as cost
    FROM donhang dh
    JOIN chitietdonhang ct ON dh.madonhang = ct.madonhang
    LEFT JOIN donvitinh dv ON ct.madonvitinh = dv.madonvitinh
    LEFT JOIN lothuoc l ON ct.malo = l.malo
    LEFT JOIN (
        SELECT ct_in.mathuoc, ct_in.solo_tam, MAX(ct_in.dongia / COALESCE(dv_in.hesoquydoi, 1)) as gianhap_per_base
        FROM chitietdonhang ct_in
        JOIN donhang dh_in ON ct_in.madonhang = dh_in.madonhang
        LEFT JOIN donvitinh dv_in ON ct_in.madonvitinh = dv_in.madonvitinh
        WHERE dh_in.loaidonhang = 'nhap' AND dh_in.trangthai IN ('daduyet', 'hoanthanh')
        GROUP BY ct_in.mathuoc, ct_in.solo_tam
    ) gia ON gia.mathuoc = l.mathuoc AND gia.solo_tam = l.solo
    WHERE dh.loaidonhang = 'xuat' AND dh.trangthai IN ('daduyet', 'hoanthanh')
  `);
  console.log(rows);
  
  const [total] = await db.query(`
    SELECT SUM(ct.soluongthucte * COALESCE(dv.hesoquydoi, 1) * COALESCE(gia.gianhap_per_base, 0)) AS tongvon
    FROM donhang dh
    JOIN chitietdonhang ct ON dh.madonhang = ct.madonhang
    LEFT JOIN donvitinh dv ON ct.madonvitinh = dv.madonvitinh
    LEFT JOIN lothuoc l ON ct.malo = l.malo
    LEFT JOIN (
        SELECT ct_in.mathuoc, ct_in.solo_tam, MAX(ct_in.dongia / COALESCE(dv_in.hesoquydoi, 1)) as gianhap_per_base
        FROM chitietdonhang ct_in
        JOIN donhang dh_in ON ct_in.madonhang = dh_in.madonhang
        LEFT JOIN donvitinh dv_in ON ct_in.madonvitinh = dv_in.madonvitinh
        WHERE dh_in.loaidonhang = 'nhap' AND dh_in.trangthai IN ('daduyet', 'hoanthanh')
        GROUP BY ct_in.mathuoc, ct_in.solo_tam
    ) gia ON gia.mathuoc = l.mathuoc AND gia.solo_tam = l.solo
    WHERE dh.loaidonhang = 'xuat' AND dh.trangthai IN ('daduyet', 'hoanthanh')
  `);
  console.log("Total tongvon:", total);
  process.exit(0);
})();
