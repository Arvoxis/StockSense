const morgan = require('morgan');

// Use 'dev' format in development, 'combined' in production
const requestLogger = morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev');

module.exports = requestLogger;
