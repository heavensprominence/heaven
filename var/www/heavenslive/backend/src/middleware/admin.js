/**
 * Admin middleware
 * Checks if user is super admin (must be used after authMiddleware)
 */
const adminMiddleware = (req, res, next) => {
  if (!req.isSuperAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = adminMiddleware;