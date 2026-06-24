const express = require('express');
const router = express.Router();
const taikhoanController = require('../controllers/taikhoanController');
const auth = require('../middlewares/authMiddleware');

// --- NHÓM 1: CÔNG KHAI (Không cần Token) ---
router.post('/taikhoan/login', taikhoanController.login);

// --- NHÓM 2: CÁ NHÂN (Chỉ cần đăng nhập - verifyToken) ---
// User có thể tự đổi mật khẩu của chính họ
router.put('/taikhoan/doimatkhau/:id', auth.verifyToken, taikhoanController.doiMatKhau);

// --- NHÓM 3: QUẢN TRỊ (Phải là Admin mới được làm - verifyToken + isAdmin) ---
router.get('/taikhoan', auth.verifyToken, auth.isAdmin, taikhoanController.getAll);
router.post('/taikhoan', auth.verifyToken, auth.isAdmin, taikhoanController.create);
router.put('/taikhoan/:id', auth.verifyToken, auth.isAdmin, taikhoanController.update);
router.delete('/taikhoan/:id', auth.verifyToken, auth.isAdmin, taikhoanController.delete);

module.exports = router;