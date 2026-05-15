const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/auth');

const authMiddleware = async (req, res, next) => {
  try {
    console.log('AUTH DEBUG:', JSON.stringify({hasAuth:!!req.headers.authorization,hasQuery:!!req.query.token,authVal:(req.headers.authorization||'').substring(0,30)}));
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Fallback: check query parameter
    const queryToken = req.query.token;
    if (queryToken) {
      try {
        const decoded2 = jwt.verify(queryToken, jwtSecret);
        req.userId = decoded2.id;
        req.userEmail = decoded2.email;
        req.isSuperAdmin = decoded2.isSuperAdmin || false;
        return next();
      } catch (e2) {}
    }
    return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    console.log('JWT VERIFY: secret='+(jwtSecret||'UNDEFINED').substring(0,10)+'... token='+token.substring(0,20)+'...');
    const decoded = jwt.verify(token, jwtSecret);
    req.userId = decoded.id;
    req.userEmail = decoded.email;
    req.isSuperAdmin = decoded.isSuperAdmin || false; console.log('JWT OK: user='+decoded.email);
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

module.exports = { verifyToken: authMiddleware };
