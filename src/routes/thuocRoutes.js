// src/routes/thuocRoutes.js
const express = require('express');
const router = express.Router();
const ThuocController = require('../controllers/thuocController');
const auth = require('../middlewares/authMiddleware');

router.use('/thuoc', auth.verifyToken);

router.get('/thuoc', auth.allowRoles('admin', 'nhanvien'), ThuocController.getAll);
router.get('/thuoc/:id', auth.allowRoles('admin', 'nhanvien'), ThuocController.getById);
router.post('/thuoc', auth.allowRoles('admin', 'nhanvien'), ThuocController.create);
router.put('/thuoc/:id', auth.allowRoles('admin', 'nhanvien'), ThuocController.update);
router.delete('/thuoc/:id', auth.allowRoles('admin', 'nhanvien'), ThuocController.delete);

module.exports = router;