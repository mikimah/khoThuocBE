// src/routes/thuocRoutes.js
const express = require('express');
const router = express.Router();
const ThuocController = require('../controllers/thuocController');
const auth = require('../middlewares/authMiddleware');

router.use('/thuoc', auth.verifyToken);

router.get('/thuoc', auth.allowRoles('admin', 'sales','kho'), ThuocController.getAll);
router.get('/thuoc/:id', auth.allowRoles('admin', 'sales','kho'), ThuocController.getById);
router.post('/thuoc', auth.allowRoles('admin', 'sales','kho'), ThuocController.create);
router.put('/thuoc/:id', auth.allowRoles('admin', 'sales','kho'), ThuocController.update);
router.delete('/thuoc/:id', auth.allowRoles('admin', 'sales','kho'), ThuocController.delete);

module.exports = router;