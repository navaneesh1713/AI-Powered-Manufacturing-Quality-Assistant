const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getIsPgConnected, getIsMongoConnected, getPgClient } = require('../config/db');
const { memoryStore } = require('../config/memoryStore');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_manufacturing_jwt_key_2026');

      if (getIsPgConnected()) {
        const client = getPgClient();
        const resPg = await client.query('SELECT id AS _id, name, email, role, plant_location FROM users WHERE id = $1', [decoded.id]);
        if (resPg.rows.length > 0) {
          req.user = resPg.rows[0];
        } else {
          const memUser = memoryStore.users.find(u => u._id === decoded.id);
          if (memUser) {
            const { password_hash, ...uClean } = memUser;
            req.user = uClean;
          }
        }
      } else if (getIsMongoConnected()) {
        req.user = await User.findById(decoded.id).select('-password_hash');
      } else {
        const memUser = memoryStore.users.find(u => u._id === decoded.id);
        if (memUser) {
          const { password_hash, ...uClean } = memUser;
          req.user = uClean;
        }
      }

      if (!req.user) {
        return res.status(401).json({ message: 'User token valid but user account no longer exists' });
      }
      return next();
    } catch (error) {
      console.error('[Auth Error]', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role '${req.user ? req.user.role : 'Guest'}' is not authorized to perform this action`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
