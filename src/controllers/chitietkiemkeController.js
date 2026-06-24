const chitietkiemkeModel = require('../models/chitietkiemkeModel');
const response = require('../utils/response');

const attachHttpMeta = (error) => {
    if (error && error.code === 'ER_DUP_ENTRY') {
        error.statusCode = 409;
        error.message = 'Chi tiết kiểm kê đã tồn tại';
    }
    return error;
};

const chitietkiemkeController = {
    getByPhieu: async (req, res, next) => {
        try {
            const data = await chitietkiemkeModel.getByPhieuId(req.params.maphieu);
            return response.ok(res, data, 'Lấy chi tiết kiểm kê thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },
    create: async (req, res, next) => {
        try {
            const result = await chitietkiemkeModel.create(req.body);
            return response.created(res, { id_moi: result.insertId }, 'Thêm chi tiết thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },
    update: async (req, res, next) => {
        try {
            const result = await chitietkiemkeModel.update(req.params.id, req.body);
            if (result.affectedRows === 0) return response.notFound(res, 'Không tìm thấy chi tiết kiểm kê');
            return response.ok(res, null, 'Cập nhật thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },
    delete: async (req, res, next) => {
        try {
            const result = await chitietkiemkeModel.delete(req.params.id);
            if (result.affectedRows === 0) return response.notFound(res, 'Không tìm thấy chi tiết kiểm kê');
            return response.ok(res, null, 'Xóa thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    }
};
module.exports = chitietkiemkeController;