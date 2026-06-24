const jwt = require('jsonwebtoken');
const response = require('../utils/response');

const normalizeRole = (role) => String(role || '').trim().toLowerCase();

const authMiddleware = {
    // 1. Kiểm tra xem đã đăng nhập chưa
    verifyToken: (req, res, next) => {
        const token = req.headers['authorization']?.split(' ')[1]; // Lấy token từ header "Bearer <token>"

        if (!token) return response.unauthorized(res, 'Bạn cần đăng nhập để thực hiện thao tác này');

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded; // Lưu thông tin user vào request để dùng ở các bước sau
            next();
        } catch (error) {
            return response.unauthorized(res, 'Phiên đăng nhập hết hạn hoặc không hợp lệ');
        }
    },

    // 2. Kiểm tra xem có phải Admin không
    isAdmin: (req, res, next) => {
        // Sau khi verifyToken chạy, req.user sẽ có thông tin vaitro
        if (req.user && normalizeRole(req.user.vaitro) === 'admin') {
            next();
        } else {
            return response.forbidden(res, 'Quyền truy cập bị từ chối: Chỉ dành cho Quản trị viên');
        }
    },

    // 3. Kiểm tra quyền theo danh sách vai trò
    allowRoles: (...roles) => (req, res, next) => {
        const userRole = normalizeRole(req.user?.vaitro);
        const allowed = roles.map(normalizeRole);

        if (allowed.includes(userRole)) {
            return next();
        }

        return response.forbidden(res, 'Quyền truy cập bị từ chối: Không đủ quyền');
    }
};

module.exports = authMiddleware;