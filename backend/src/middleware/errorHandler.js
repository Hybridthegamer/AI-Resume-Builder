const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Postgres errors
  if (err.code === '23505') {
    return res.status(409).json({ error: 'A record with this information already exists.' });
  }
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referenced record does not exist.' });
  }
  if (err.code === '22P02') {
    return res.status(400).json({ error: 'Invalid UUID format.' });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired.' });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  // Default error
  const status = err.status || err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production' && status === 500
      ? 'An internal server error occurred.'
      : err.message || 'An internal server error occurred.';

  res.status(status).json({ error: message });
};

const notFound = (req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
};

module.exports = { errorHandler, notFound };
