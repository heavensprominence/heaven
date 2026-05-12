// Middleware to handle /credon subpath routing
module.exports = (req, res, next) => {
  // Check if request is coming from /credon subpath
  const isSubPath = req.headers['x-original-uri']?.startsWith('/credon') || 
                    req.headers['referer']?.includes('/credon') ||
                    req.headers['x-forwarded-prefix'] === '/credon';
  
  if (isSubPath) {
    req.isSubPath = true;
    req.basePath = '/credon';
    
    // Store original redirect method
    const originalRedirect = res.redirect;
    
    // Override redirect to include subpath
    res.redirect = function(url) {
      if (typeof url === 'string' && url.startsWith('/') && !url.startsWith('/credon') && !url.startsWith('http')) {
        url = '/credon' + url;
      }
      return originalRedirect.call(this, url);
    };
    
    // Also handle json responses that might contain redirect URLs
    const originalJson = res.json;
    res.json = function(obj) {
      if (obj && obj.redirect && typeof obj.redirect === 'string' && obj.redirect.startsWith('/') && !obj.redirect.startsWith('/credon') && !obj.redirect.startsWith('http')) {
        obj.redirect = '/credon' + obj.redirect;
      }
      return originalJson.call(this, obj);
    };
  }
  
  next();
};
