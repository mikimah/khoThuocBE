const response = require('../utils/response');

const notFoundHandler = (req, res) => {
    return response.notFound(res, `Không tìm thấy endpoint: ${req.originalUrl}`);
};

const errorHandler = (err, req, res, next) => {
    const status = err.statusCode || err.status || 500;
    const message = err.message || 'Internal Server Error';
    const code = err.code || (status === 500 ? 'INTERNAL_SERVER_ERROR' : null);
    const details = err.details || null;
    const stack = process.env.NODE_ENV === 'development' ? err.stack : null;

    if (status >= 500) {
        console.error('Error Log:', err.stack || err);
    }

    return response.error(res, message, status, err, code, details, { stack });
};

module.exports = {
    notFoundHandler,
    errorHandler,
};