const express = require('express');
const router = express.Router();
const donhangController = require('../controllers/donhangController');
const auth = require('../middlewares/authMiddleware');

// Tra cứu đơn hàng công khai (không cần token)
router.post('/donhang/tracuu-congkhai', donhangController.traCuuCongKhai);

router.use('/donhang', auth.verifyToken);

// Lấy danh sách tổng
router.get('/donhang', auth.allowRoles('admin', 'nhanvien'), donhangController.getAllDonHang);

// Lọc đơn hàng Nhập / Xuất (Bắt buộc phải để trước dòng /:id)
// Test thử: GET /api/donhang/loai/Nhap
router.get('/donhang/loai/:loaidonhang', auth.allowRoles('admin', 'nhanvien'), donhangController.getDonHangByLoai);

// Lấy chi tiết theo ID
router.get('/donhang/:id', auth.allowRoles('admin', 'nhanvien'), donhangController.getDonHangById);

// Tạo mới
router.post('/donhang', auth.allowRoles('admin', 'nhanvien'), donhangController.createDonHang);

// Cập nhật TRẠNG THÁI đơn hàng (API chuyên dụng)
// Test: PUT /api/donhang/1/trangthai với body JSON: { "trangthai": "daduyet" }
router.put('/donhang/:id/trangthai', auth.allowRoles('admin'), donhangController.updateTrangThai);

// Cập nhật thông tin chung
router.put('/donhang/:id', auth.allowRoles('admin', 'nhanvien'), donhangController.updateDonHang);

// Xóa đơn hàng
router.delete('/donhang/:id', auth.allowRoles('admin'), donhangController.deleteDonHang);

module.exports = router;