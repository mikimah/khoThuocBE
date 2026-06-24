const express = require('express');
const router = express.Router();
const vitrikhoController = require('../controllers/vitrikhoController');
const auth = require('../middlewares/authMiddleware');

router.use('/vitrikho', auth.verifyToken);

router.get('/vitrikho', auth.allowRoles('admin', 'nhanvien'), vitrikhoController.getAll);
router.get('/vitrikho/:id', auth.allowRoles('admin', 'nhanvien'), vitrikhoController.getById);
router.post('/vitrikho', auth.allowRoles('admin', 'nhanvien'), vitrikhoController.create);
router.put('/vitrikho/:id', auth.allowRoles('admin', 'nhanvien'), vitrikhoController.update);
router.delete('/vitrikho/:id', auth.allowRoles('admin'), vitrikhoController.delete);

module.exports = router;