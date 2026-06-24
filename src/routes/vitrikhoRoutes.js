const express = require('express');
const router = express.Router();
const vitrikhoController = require('../controllers/vitrikhoController');
const auth = require('../middlewares/authMiddleware');

router.use('/vitrikho', auth.verifyToken);

router.get('/vitrikho', auth.allowRoles('admin', 'kho'), vitrikhoController.getAll);
router.get('/vitrikho/:id', auth.allowRoles('admin', 'kho'), vitrikhoController.getById);
router.post('/vitrikho', auth.allowRoles('admin', 'kho'), vitrikhoController.create);
router.put('/vitrikho/:id', auth.allowRoles('admin', 'kho'), vitrikhoController.update);
router.delete('/vitrikho/:id', auth.allowRoles('admin'), vitrikhoController.delete);

module.exports = router;