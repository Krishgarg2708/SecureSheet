const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// @route POST /api/auth/register
// First registered user automatically becomes ADMIN; everyone after is USER by default
// (admins can promote later via manage-users routes).
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'name, email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'ADMIN' : 'USER';

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ name, email, passwordHash, role });

    const token = signToken(user);
    res.status(201).json({ success: true, token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Registration failed.', error: err.message });
  }
};

// @route POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = signToken(user);
    res.json({ success: true, token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Login failed.', error: err.message });
  }
};

// @route GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject() });
};

// @route POST /api/auth/logout
// Stateless JWT: logout is handled client-side by discarding the token.
// This endpoint exists for symmetry / future token-blacklist support.
exports.logout = async (req, res) => {
  res.json({ success: true, message: 'Logged out. Discard the token client-side.' });
};
