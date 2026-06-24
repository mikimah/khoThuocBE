const express = require('express');
const router = express.Router();
const DoiTacController = require('../controllers/doitacController');
const auth = require('../middlewares/authMiddleware');

router.use('/doitac', auth.verifyToken);

router.get('/doitac', auth.allowRoles('admin', 'nhanvien'), DoiTacController.getAllDoiTac);

// Đừng quên test API này nhé: GET /api/doitac/loai/NhaCungCap
router.get('/doitac/loai/:loaidoitac', auth.allowRoles('admin', 'nhanvien'), DoiTacController.getDoiTacByLoai); 
router.get('/doitac/:id', auth.allowRoles('admin', 'nhanvien'), DoiTacController.getDoiTacById);

router.post('/doitac', auth.allowRoles('admin', 'nhanvien'), DoiTacController.createDoiTac);
router.put('/doitac/:id', auth.allowRoles('admin', 'nhanvien'), DoiTacController.updateDoiTac);
router.delete('/doitac/:id', auth.allowRoles('admin'), DoiTacController.deleteDoiTac);

module.exports = router;