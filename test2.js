const db = require('./src/configs/db');
(async () => {
  const [rows] = await db.query(`
    SELECT dh.madonhang, dh.loaidonhang, ct.mathuoc, ct.soluongthucte, ct.dongia, dv.hesoquydoi
    FROM donhang dh
    JOIN chitietdonhang ct ON dh.madonhang = ct.madonhang
    LEFT JOIN donvitinh dv ON ct.madonvitinh = dv.madonvitinh
    LIMIT 20
  `);
  console.log(rows);
  process.exit(0);
})();
