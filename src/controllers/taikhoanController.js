const taikhoanModel = require('../models/taikhoanModel');
const bcrypt = require('bcrypt');
const response = require('../utils/response');
const jwt = require('jsonwebtoken');
const redisFunc = require('../utils/redisFunc');

const cacheKey = 'taikhoan'

const attachHttpMeta = (error) => {
    if (error && error.code === 'ER_DUP_ENTRY') {
        error.statusCode = 409;
        error.message = 'Tên đăng nhập đã tồn tại';
    }
    return error;
};



const taikhoanController = {
    // 1. API Đăng nhập (Xử lý cả pass thường lẫn pass hash)
    login: async (req, res, next) => {
        try {
            const { tendangnhap, matkhau } = req.body;
            
            if (!tendangnhap || !matkhau) {
                return response.badRequest(res, 'Vui lòng nhập tài khoản và mật khẩu');
            }

            const users = await taikhoanModel.getByUsername(tendangnhap);
            if (users.length === 0) {
                return response.unauthorized(res, 'Sai tên đăng nhập hoặc mật khẩu');
            }

            const user = users[0];
            let isMatch = false;

            if (user.matkhau.startsWith('$2')) {
                isMatch = await bcrypt.compare(matkhau, user.matkhau);
            } else {
                isMatch = (matkhau === user.matkhau);
            }

            if (!isMatch) {
                return response.unauthorized(res, 'Sai tên đăng nhập hoặc mật khẩu');
            }
            const token = jwt.sign(
            { id: user.mataikhoan, vaitro: user.vaitro },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            return response.ok(
                res,
                { 
                    token, 
                    user: { mataikhoan: user.mataikhoan, tendangnhap: user.tendangnhap, vaitro: user.vaitro } 
                },
            'Đăng nhập thành công'
            );
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },

    // 2. API Đổi mật khẩu
    doiMatKhau: async (req, res, next) => {
        try {
            const { id } = req.params; 
            const { matKhauCu, matKhauMoi } = req.body;

            if (!matKhauCu || !matKhauMoi) {
                return response.badRequest(res, 'Vui lòng nhập đủ mật khẩu cũ và mới');
            }

            const requesterId = req.user?.id;
            const requesterRole = req.user?.vaitro || '';
            const isAdmin = requesterRole.toLowerCase() === 'admin';

            if (!isAdmin && String(requesterId) !== String(id)) {
                return response.forbidden(res, 'Bạn chỉ được đổi mật khẩu của chính mình');
            }

            // 🔥 ĐÃ SỬA: Gọi thẳng getById thay vì getAll
            const users = await taikhoanModel.getById(id); 
            
            if (users.length === 0) return response.notFound(res, 'Không tìm thấy tài khoản');
            const user = users[0]; // Lấy thẳng user đầu tiên

            // Kiểm tra mật khẩu cũ
            let isMatch = false;
            if (user.matkhau.startsWith('$2')) {
                isMatch = await bcrypt.compare(matKhauCu, user.matkhau);
            } else {
                isMatch = (matKhauCu === user.matkhau);
            }
            
            if (!isMatch) return response.badRequest(res, 'Mật khẩu cũ không chính xác');

            // Băm mật khẩu mới và lưu xuống DB
            const hashedMatKhauMoi = await bcrypt.hash(matKhauMoi, 10);
            await taikhoanModel.update(id, { matkhau: hashedMatKhauMoi, vaitro: user.vaitro });

            return response.ok(res, null, 'Đổi mật khẩu thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },

    // 3. API Lấy danh sách tài khoản
    getAll: async (req, res, next) => {
        try {
            const cacheData = await getFromCache(cacheKey);
            if(cacheData){
                return response.ok(res, cacheData, 'Lấy danh sách tài khoản thành công');
            }
            const data = await taikhoanModel.getAll();
            await redisFunc.addToCache(cacheKey, data);
            return response.ok(res, data, 'Lấy danh sách tài khoản thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },

    // 4. API Tạo tài khoản mới (Bắt buộc Hash mật khẩu)
    create: async (req, res, next) => {
        try {
            const { tendangnhap, matkhau, vaitro } = req.body;
            const normalizedUsername = (tendangnhap || '').trim();

            if (!normalizedUsername || !matkhau) {
                return response.badRequest(res, 'Tên đăng nhập và mật khẩu là bắt buộc');
            }

            const isExist = await taikhoanModel.existsByUsername(normalizedUsername);
            if (isExist) {
                return response.conflict(res, `Tên đăng nhập '${normalizedUsername}' đã tồn tại! Vui lòng chọn tên khác.`);
            }

            // Băm mật khẩu trước khi lưu
            const hashedMatKhau = await bcrypt.hash(matkhau, 10);
            
            const dataToSave = {
                tendangnhap: normalizedUsername,
                matkhau: hashedMatKhau,
                vaitro
            };

            const result = await taikhoanModel.create(dataToSave);
            await redisFunc.deleteCache(cacheKey);
            return response.created(res, { id_moi: result.insertId }, 'Tạo tài khoản thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },

    // 5. API Cập nhật tài khoản (Có kiểm tra Hash nếu đổi pass)
    update: async (req, res, next) => {
        try {
            const { id } = req.params;
            let { matkhau, vaitro } = req.body;

            if (matkhau) {
                 matkhau = await bcrypt.hash(matkhau, 10);
            }

            const result = await taikhoanModel.update(id, { matkhau, vaitro });
            if (result.affectedRows === 0) return response.notFound(res, 'Không tìm thấy tài khoản');
            await redisFunc.deleteCache(cacheKey);
            return response.ok(res, null, 'Cập nhật thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },

    // 6. API Xóa tài khoản
    delete: async (req, res, next) => {
        try {
            const { id } = req.params;
            
            if (id == 0 || id == 1) {
                return response.badRequest(res, 'Bảo mật: Không được phép xóa tài khoản Admin gốc của hệ thống!');
            }
            const result = await taikhoanModel.delete(id);
            if (result.affectedRows === 0) return response.notFound(res, 'Không tìm thấy tài khoản');
            await redisFunc.deleteCache(cacheKey);
            return response.ok(res, null, 'Xóa thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    }
};

module.exports = taikhoanController;