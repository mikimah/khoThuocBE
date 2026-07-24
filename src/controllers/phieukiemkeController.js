const phieukiemkeModel = require('../models/phieukiemkeModel');
const response = require('../utils/response');
const redisFunc = require('../utils/redisFunc');

const cacheKey = 'phieukiemke';

const attachHttpMeta = (error) => {
    if (error && error.code === 'ER_DUP_ENTRY') {
        error.statusCode = 409;
        error.message = 'Phiếu kiểm kê đã tồn tại';
    }
    return error;
};

const phieukiemkeController = {
    getAll: async (req, res, next) => {
        try {
            const cacheData = await redisFunc.getFromCache(cacheKey);
            if (cacheData) {
                return response.ok(res, cacheData, 'Lấy danh sách phiếu kiểm kê thành công (từ cache)');
            }
            const data = await phieukiemkeModel.getAll();
            await redisFunc.addToCache(cacheKey, data);
            return response.ok(res, data, 'Lấy danh sách phiếu kiểm kê thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },
    getById: async (req, res, next) => {
        try {
            const data = await phieukiemkeModel.getById(req.params.maphieu);
            if (data.length === 0) return response.notFound(res, 'Không tìm thấy phiếu');
            return response.ok(res, data[0], 'Lấy phiếu kiểm kê thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },
    create: async (req, res, next) => {
        try {
            if(!req.body.maphieu) return response.badRequest(res, 'Mã phiếu là bắt buộc');
            await phieukiemkeModel.create(req.body);
            await redisFunc.deleteCache(cacheKey); // Xóa cache sau khi tạo mới
            return response.created(res, { maphieu: req.body.maphieu }, 'Tạo phiếu kiểm kê thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },
    updateTrangThai: async (req, res, next) => {
        try {
            if (!req.body.trangthai) return response.badRequest(res, 'Thiếu dữ liệu trạng thái');
            const result = await phieukiemkeModel.updateTrangThai(req.params.maphieu, req.body.trangthai);
            if (result.affectedRows === 0) return response.notFound(res, 'Không tìm thấy phiếu');
            await redisFunc.deleteCache(cacheKey); // Xóa cache sau khi cập nhật
            return response.ok(res, null, 'Cập nhật trạng thái thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },
    delete: async (req, res, next) => {
        try {
            const result = await phieukiemkeModel.delete(req.params.maphieu);
            if (result.affectedRows === 0) return response.notFound(res, 'Không tìm thấy phiếu');
            await redisFunc.deleteCache(cacheKey); // Xóa cache sau khi xóa
            return response.ok(res, null, 'Xóa thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    }
};
module.exports = phieukiemkeController;