const express = require('express');
const router = express.Router();
const thongkeController = require('../controllers/thongkeController');
const auth = require('../middlewares/authMiddleware');

router.use('/thongke', auth.verifyToken);

router.get('/thongke/tongquan', auth.allowRoles('admin'), thongkeController.getTongQuan);
router.get('/thongke/bieudo', auth.allowRoles('admin'), thongkeController.getBieuDo);
router.get('/thongke/top-thuoc', auth.allowRoles('admin'), thongkeController.getTopThuoc);

module.exports = router;
