const vitrikhoModel = require('../models/vitrikhoModel');
const response = require('../utils/response');

const attachHttpMeta = (error) => {
    if (error && error.code === 'ER_DUP_ENTRY') {
        error.statusCode = 409;
        error.message = 'Mã tọa độ vị trí kho này đã tồn tại';
    }
    return error;
};

const vitrikhoController = {
    getAll: async (req, res, next) => {
        try {
            const data = await vitrikhoModel.getAll();
            return response.ok(res, data, 'Lấy danh sách vị trí kho thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },

    getById: async (req, res, next) => {
        try {
            const data = await vitrikhoModel.getById(req.params.id);
            if (data.length === 0) return response.notFound(res, 'Không tìm thấy vị trí kho');
            return response.ok(res, data[0], 'Lấy vị trí kho thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },

    create: async (req, res, next) => {
        try {
            const { ma_toado, ten_vitri, loai_baoquan } = req.body;

            if (!ma_toado || !ten_vitri) {
                return response.badRequest(res, 'Thiếu dữ liệu bắt buộc: ma_toado và ten_vitri không được để trống');
            }

            const result = await vitrikhoModel.create(req.body);
            return response.created(res, { mavitri: result.insertId }, 'Thêm vị trí kho mới thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },

    update: async (req, res, next) => {
        try {
            const { ma_toado, ten_vitri, loai_baoquan } = req.body;
            if (!ma_toado || !ten_vitri || !loai_baoquan) {
                return response.badRequest(res, 'Thiếu dữ liệu cập nhật: ma_toado, ten_vitri, loai_baoquan');
            }

            const result = await vitrikhoModel.update(req.params.id, req.body);
            if (result.affectedRows === 0) return response.notFound(res, 'Không tìm thấy vị trí kho');
            return response.ok(res, null, 'Cập nhật thông tin vị trí kho thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },

    delete: async (req, res, next) => {
        try {
            const result = await vitrikhoModel.delete(req.params.id);
            if (result.affectedRows === 0) return response.notFound(res, 'Không tìm thấy vị trí kho để xóa');
            return response.ok(res, null, 'Xóa vị trí kho thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    }
};

module.exports = vitrikhoController;