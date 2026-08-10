const express = require('express');
const router = express.Router();
const LoThuocController = require('../controllers/lothuocController');
const auth = require('../middlewares/authMiddleware');

router.use('/lothuoc', auth.verifyToken);

router.get('/lothuoc', auth.allowRoles('admin', 'kho', 'sales'), LoThuocController.getAllLoThuoc);
router.get('/lothuoc/thuoc/:mathuoc', auth.allowRoles('admin', 'kho', 'sales'), LoThuocController.getLoByThuoc); // API này rất quan trọng
router.post('/lothuoc', auth.allowRoles('admin', 'kho', 'sales'), LoThuocController.createLoThuoc);
router.put('/lothuoc/:malo', auth.allowRoles('admin', 'kho','sales'), LoThuocController.updateLoThuoc);
router.delete('/lothuoc/:malo', auth.allowRoles('admin'), LoThuocController.deleteLoThuoc);
router.post('/lothuoc/:malo/tach', auth.allowRoles('admin', 'kho'), LoThuocController.tachLo);

module.exports = router;