const express = require('express');
const router = express.Router();
const tieuhuyController = require('../controllers/tieuhuyController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, tieuhuyController.getAll);
router.get('/:maphieutieuhuy', verifyToken, tieuhuyController.getById);
router.post('/', verifyToken, tieuhuyController.create);
router.put('/:maphieutieuhuy', verifyToken, tieuhuyController.update);
router.put('/:maphieutieuhuy/approve', verifyToken, tieuhuyController.approve);
router.delete('/:maphieutieuhuy', verifyToken, tieuhuyController.delete);

module.exports = router;
