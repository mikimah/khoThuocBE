const express = require('express');
const router = express.Router();
const donhangController = require('../controllers/donhangController');
const auth = require('../middlewares/authMiddleware');

// Tra cứu đơn hàng công khai (không cần token)
router.post('/donhang/tracuu-congkhai', donhangController.traCuuCongKhai);

router.use('/donhang', auth.verifyToken);

// Lấy danh sách tổng
router.get('/donhang', auth.allowRoles('admin', 'kho', 'sales'), donhangController.getAllDonHang);

// Lọc đơn hàng Nhập / Xuất (Bắt buộc phải để trước dòng /:id)
router.get('/donhang/loai/:loaidonhang', auth.allowRoles('admin', 'kho', 'sales'), donhangController.getDonHangByLoai);

// Lấy chi tiết theo ID
router.get('/donhang/:id', auth.allowRoles('admin', 'kho', 'sales'), donhangController.getDonHangById);
router.post('/donhang', auth.allowRoles('admin', 'kho', 'sales'), donhangController.createDonHang);
router.put('/donhang/:id/trangthai', auth.allowRoles('admin'), donhangController.updateTrangThai);
router.put('/donhang/:id', auth.allowRoles('admin', 'kho', 'sales'), donhangController.updateDonHang);
router.delete('/donhang/:id', auth.allowRoles('admin'), donhangController.deleteDonHang);

module.exports = router;