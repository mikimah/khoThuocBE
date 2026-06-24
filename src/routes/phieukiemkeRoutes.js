const express = require('express');
const router = express.Router();
const phieukiemkeController = require('../controllers/phieukiemkeController');
const auth = require('../middlewares/authMiddleware');

router.use('/phieukiemke', auth.verifyToken);

router.get('/phieukiemke', auth.allowRoles('admin', 'kho'), phieukiemkeController.getAll);
router.get('/phieukiemke/:maphieu', auth.allowRoles('admin', 'kho'), phieukiemkeController.getById);
router.post('/phieukiemke', auth.allowRoles('admin', 'kho'), phieukiemkeController.create);
router.put('/phieukiemke/:maphieu/trangthai', auth.allowRoles('admin'), phieukiemkeController.updateTrangThai);
router.delete('/phieukiemke/:maphieu', auth.allowRoles('admin'), phieukiemkeController.delete);

module.exports = router;