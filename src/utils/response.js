const isProduction = process.env.NODE_ENV === 'production';

const sendSuccess = (res, status = 200, message = 'Thành công', data = null) => {
    return res.status(status).json({
        success: true,
        message,
        data,
    });
};

const sendError = (res, status = 500, message = 'Đã xảy ra lỗi', error = null, code = null, details = null, meta = null) => {
    return res.status(status).json({
        success: false,
        message,
        code,
        details,
        error: !isProduction && error ? error.message || String(error) : null,
        ...(meta && typeof meta === 'object' ? meta : {}),
    });
};

const response = {
    // Backward-compatible helpers
    success: (res, data, message = 'Thành công', status = 200) => sendSuccess(res, status, message, data),
    error: (res, message = 'Đã xảy ra lỗi', status = 500, error = null, code = null, details = null, meta = null) =>
        sendError(res, status, message, error, code, details, meta),

    // Success status helpers
    ok: (res, data = null, message = 'OK') => sendSuccess(res, 200, message, data),
    created: (res, data = null, message = 'Tạo mới thành công') => sendSuccess(res, 201, message, data),
    noContent: (res) => res.status(204).send(),

    // Client error helpers
    badRequest: (res, message = 'Dữ liệu gửi lên không hợp lệ', error = null, details = null) =>
        sendError(res, 400, message, error, 'BAD_REQUEST', details),
    unauthorized: (res, message = 'Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn', error = null) =>
        sendError(res, 401, message, error, 'UNAUTHORIZED'),
    forbidden: (res, message = 'Bạn không có quyền thực hiện thao tác này', error = null) =>
        sendError(res, 403, message, error, 'FORBIDDEN'),
    notFound: (res, message = 'Không tìm thấy dữ liệu', error = null) =>
        sendError(res, 404, message, error, 'NOT_FOUND'),
    conflict: (res, message = 'Dữ liệu đã tồn tại hoặc bị xung đột', error = null, details = null) =>
        sendError(res, 409, message, error, 'CONFLICT', details),
    unprocessableEntity: (res, message = 'Dữ liệu không thỏa điều kiện nghiệp vụ', error = null, details = null) =>
        sendError(res, 422, message, error, 'UNPROCESSABLE_ENTITY', details),

    // Server error helpers
    serverError: (res, message = 'Lỗi Server', error = null, details = null) =>
        sendError(res, 500, message, error, 'INTERNAL_SERVER_ERROR', details),
};

module.exports = response;