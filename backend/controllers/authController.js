const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { getIsPgConnected, getIsMongoConnected, getPgClient } = require('../config/db');
const { memoryStore } = require('../config/memoryStore');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_manufacturing_jwt_key_2026', {
    expiresIn: '30d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, plant_location } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    const cleanEmail = email.toLowerCase();
    const password_hash = await bcrypt.hash(password, 10);
    const userId = `usr_${Date.now()}`;

    if (getIsPgConnected()) {
      const client = getPgClient();
      const existing = await client.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      await client.query(
        'INSERT INTO users (id, name, email, password_hash, role, plant_location) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, name, cleanEmail, password_hash, role || 'Inspector', plant_location || 'Plant Alpha - Detroit']
      );

      return res.status(201).json({
        _id: userId,
        name,
        email: cleanEmail,
        role: role || 'Inspector',
        plant_location: plant_location || 'Plant Alpha - Detroit',
        token: generateToken(userId)
      });
    } else if (getIsMongoConnected()) {
      const userExists = await User.findOne({ email: cleanEmail });
      if (userExists) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      const user = await User.create({
        name,
        email: cleanEmail,
        password_hash: password,
        role: role || 'Inspector',
        plant_location: plant_location || 'Plant Alpha - Detroit'
      });

      return res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        plant_location: user.plant_location,
        token: generateToken(user._id)
      });
    } else {
      const userExists = memoryStore.users.find(u => u.email.toLowerCase() === cleanEmail);
      if (userExists) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      const newUser = {
        _id: userId,
        name,
        email: cleanEmail,
        password_hash,
        role: role || 'Inspector',
        plant_location: plant_location || 'Plant Alpha - Detroit',
        matchPassword: async function (p) { return await bcrypt.compare(p, this.password_hash); }
      };

      memoryStore.users.push(newUser);

      return res.status(201).json({
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        plant_location: newUser.plant_location,
        token: generateToken(newUser._id)
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const cleanEmail = email.toLowerCase();

    if (getIsPgConnected()) {
      const client = getPgClient();
      const resPg = await client.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);

      if (resPg.rows.length > 0) {
        const userPg = resPg.rows[0];
        const isMatch = await bcrypt.compare(password, userPg.password_hash);
        if (isMatch) {
          return res.json({
            _id: userPg.id,
            name: userPg.name,
            email: userPg.email,
            role: userPg.role,
            plant_location: userPg.plant_location,
            token: generateToken(userPg.id)
          });
        }
      }

      // Check seed memory store as fallback
      const memUser = memoryStore.users.find(u => u.email.toLowerCase() === cleanEmail);
      if (memUser && (await memUser.matchPassword(password))) {
        return res.json({
          _id: memUser._id,
          name: memUser.name,
          email: memUser.email,
          role: memUser.role,
          plant_location: memUser.plant_location,
          token: generateToken(memUser._id)
        });
      }

      return res.status(401).json({ message: 'Invalid email or password' });
    } else if (getIsMongoConnected()) {
      const user = await User.findOne({ email: cleanEmail });
      if (user && (await user.matchPassword(password))) {
        return res.json({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          plant_location: user.plant_location,
          token: generateToken(user._id)
        });
      } else {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
    } else {
      const user = memoryStore.users.find(u => u.email.toLowerCase() === cleanEmail);
      if (user && (await user.matchPassword(password))) {
        return res.json({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          plant_location: user.plant_location,
          token: generateToken(user._id)
        });
      } else {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    if (req.user) {
      return res.json(req.user);
    }
    res.status(404).json({ message: 'User not found' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, getUserProfile };
