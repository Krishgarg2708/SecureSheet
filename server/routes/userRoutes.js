const express = require('express');
const router = express.Router();
const { listUsers, createUser, updateUser, removeUser } = require('../controllers/userController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.use(protect, requireRole('ADMIN'));

router.get('/', listUsers);
router.post('/', createUser);
router.patch('/:id', updateUser);
router.delete('/:id', removeUser);

module.exports = router;
