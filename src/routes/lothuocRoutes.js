const express = require('express');
const router = express.Router();
const LoThuocController = require('../controllers/lothuocController');
const auth = require('../middlewares/authMiddleware');

router.use('/lothuoc', auth.verifyToken);

router.get('/lothuoc', auth.allowRoles('admin', 'nhanvien'), LoThuocController.getAllLoThuoc);
router.get('/lothuoc/thuoc/:mathuoc', auth.allowRoles('admin', 'nhanvien'), LoThuocController.getLoByThuoc); // API này rất quan trọng
router.post('/lothuoc', auth.allowRoles('admin', 'nhanvien'), LoThuocController.createLoThuoc);
router.put('/lothuoc/:malo', auth.allowRoles('admin', 'nhanvien'), LoThuocController.updateLoThuoc);
router.delete('/lothuoc/:malo', auth.allowRoles('admin', 'nhanvien'), LoThuocController.deleteLoThuoc);

module.exports = router;