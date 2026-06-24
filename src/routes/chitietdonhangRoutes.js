const express = require('express');
const router = express.Router();
const chitietdonhangController = require('../controllers/chitietdonhangController');
const auth = require('../middlewares/authMiddleware');

router.use('/chitietdonhang', auth.verifyToken);

// Tuyến đường lấy TOÀN BỘ CÁC MÓN của 1 đơn hàng cụ thể
router.get('/chitietdonhang/donhang/:madonhang', auth.allowRoles('admin', 'kho', 'sales'), chitietdonhangController.getChiTietByDonHang);

router.get('/chitietdonhang/:id', auth.allowRoles('admin', 'kho', 'sales'), chitietdonhangController.getChiTietById);
router.post('/chitietdonhang', auth.allowRoles('admin', 'kho', 'sales'), chitietdonhangController.createChiTiet);
router.put('/chitietdonhang/:id', auth.allowRoles('admin', 'kho', 'sales'), chitietdonhangController.updateChiTiet);
router.delete('/chitietdonhang/:id', auth.allowRoles('admin'), chitietdonhangController.deleteChiTiet);

module.exports = router;