const express = require('express');
const router = express.Router();
const donvitinhController = require('../controllers/donvitinhController');
const auth = require('../middlewares/authMiddleware');

router.use('/donvitinh', auth.verifyToken);

router.get('/donvitinh', auth.allowRoles('admin', 'nhanvien'), donvitinhController.getAll);
// Đưa route cụ thể lên trên
router.get('/donvitinh/thuoc/:mathuoc', auth.allowRoles('admin', 'nhanvien'), donvitinhController.getByThuoc); 
router.post('/donvitinh', auth.allowRoles('admin', 'nhanvien'), donvitinhController.create);
router.put('/donvitinh/:id', auth.allowRoles('admin', 'nhanvien'), donvitinhController.update);
router.delete('/donvitinh/:id', auth.allowRoles('admin', 'nhanvien'), donvitinhController.delete);

module.exports = router;