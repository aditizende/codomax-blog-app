const jwt = require('jsonwebtoken');

const JWT_SECRET = "my_super_secret_key_123";

const verifyToken = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    // Expecting token format: "Bearer <token>"
    const tokenString = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
    const verified = jwt.verify(tokenString, JWT_SECRET);
    req.user = verified; // Attach user info (id, username) to request object
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid or expired token." });
  }
};

module.exports = verifyToken;