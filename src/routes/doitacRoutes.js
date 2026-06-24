const express = require('express');
const router = express.Router();
const DoiTacController = require('../controllers/doitacController');
const auth = require('../middlewares/authMiddleware');

router.use('/doitac', auth.verifyToken);

router.get('/doitac', auth.allowRoles('admin', 'sales','kho'), DoiTacController.getAllDoiTac);

// Đừng quên test API này nhé: GET /api/doitac/loai/NhaCungCap
router.get('/doitac/loai/:loaidoitac', auth.allowRoles('admin', 'kho', 'sales'), DoiTacController.getDoiTacByLoai); 
router.get('/doitac/:id', auth.allowRoles('admin', 'kho', 'sales'), DoiTacController.getDoiTacById);

router.post('/doitac', auth.allowRoles('admin', 'kho', 'sales'), DoiTacController.createDoiTac);
router.put('/doitac/:id', auth.allowRoles('admin', 'kho', 'sales'), DoiTacController.updateDoiTac);
router.delete('/doitac/:id', auth.allowRoles('admin'), DoiTacController.deleteDoiTac);

module.exports = router;