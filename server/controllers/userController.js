const User = require('../models/User');

// @route GET /api/users  (ADMIN)
exports.listUsers = async (req, res) => {
  const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
  res.json({ success: true, users });
};

// @route POST /api/users  (ADMIN) - admin creates a user account directly
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'name, email, password required.' });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ success: false, message: 'Email already exists.' });

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: role === 'ADMIN' ? 'ADMIN' : 'USER',
    });
    res.status(201).json({ success: true, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create user.', error: err.message });
  }
};

// @route PATCH /api/users/:id  (ADMIN) - update role / active status
exports.updateUser = async (req, res) => {
  try {
    const { role, isActive, name } = req.body;
    const update = {};
    if (role) update.role = role;
    if (typeof isActive === 'boolean') update.isActive = isActive;
    if (name) update.name = name;

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-passwordHash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Update failed.', error: err.message });
  }
};

// @route DELETE /api/users/:id  (ADMIN)
exports.removeUser = async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You cannot remove your own account.' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, message: 'User removed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Delete failed.', error: err.message });
  }
};
