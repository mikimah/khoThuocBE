const express = require('express');
const router = express.Router();
const chitietkiemkeController = require('../controllers/chitietkiemkeController');
const auth = require('../middlewares/authMiddleware');

router.use('/chitietkiemke', auth.verifyToken);

router.get('/chitietkiemke/phieu/:maphieu', auth.allowRoles('admin', 'nhanvien'), chitietkiemkeController.getByPhieu);
router.post('/chitietkiemke', auth.allowRoles('admin', 'nhanvien'), chitietkiemkeController.create);
router.put('/chitietkiemke/:id', auth.allowRoles('admin', 'nhanvien'), chitietkiemkeController.update);
router.delete('/chitietkiemke/:id', auth.allowRoles('admin'), chitietkiemkeController.delete);

module.exports = router;