const express = require('express');
const router = express.Router();
const chitietkiemkeController = require('../controllers/chitietkiemkeController');
const auth = require('../middlewares/authMiddleware');

router.use('/chitietkiemke', auth.verifyToken);

router.get('/chitietkiemke/phieu/:maphieu', auth.allowRoles('admin', 'kho'), chitietkiemkeController.getByPhieu);
router.post('/chitietkiemke', auth.allowRoles('admin', 'kho'), chitietkiemkeController.create);
router.put('/chitietkiemke/:id', auth.allowRoles('admin', 'kho'), chitietkiemkeController.update);
router.delete('/chitietkiemke/:id', auth.allowRoles('admin'), chitietkiemkeController.delete);

module.exports = router;