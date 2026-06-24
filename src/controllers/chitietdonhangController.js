const chitietdonhangModel = require('../models/chitietdonhangModel');
const response = require('../utils/response');

const attachHttpMeta = (error) => {
    if (error && error.code === 'ER_DUP_ENTRY') {
        error.statusCode = 409;
        error.message = 'Chi tiết đơn hàng đã tồn tại';
    }
    return error;
};

const chitietdonhangController = {
    // Lấy chi tiết theo Mã Đơn Hàng
    getChiTietByDonHang: async (req, res, next) => {
        try {
            const { madonhang } = req.params;
            const data = await chitietdonhangModel.getByDonHangId(madonhang);
            return response.ok(res, data, 'Lấy chi tiết đơn hàng thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },

    // Lấy 1 dòng chi tiết
    getChiTietById: async (req, res, next) => {
        try {
            const { id } = req.params;
            const data = await chitietdonhangModel.getById(id);
            if (data.length === 0) return response.notFound(res, 'Không tìm thấy chi tiết đơn hàng');
            return response.ok(res, data[0], 'Lấy chi tiết đơn hàng thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },

    // Thêm món hàng vào đơn
    createChiTiet: async (req, res, next) => {
        try {
            const result = await chitietdonhangModel.createWithBusinessLogic(req.body);
            return response.created(res, { mactdh_moi: result.insertId }, 'Thêm chi tiết đơn hàng thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },

    // Cập nhật số lượng / giá
    updateChiTiet: async (req, res, next) => {
        try {
            const { id } = req.params;
            const result = await chitietdonhangModel.update(id, req.body);
            if (result.affectedRows === 0) return response.notFound(res, 'Không tìm thấy chi tiết đơn hàng');
            return response.ok(res, null, 'Cập nhật thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },

    // Xóa món hàng khỏi đơn
    deleteChiTiet: async (req, res, next) => {
        try {
            const { id } = req.params;
            const result = await chitietdonhangModel.delete(id);
            if (result.affectedRows === 0) return response.notFound(res, 'Không tìm thấy chi tiết đơn hàng');
            return response.ok(res, null, 'Xóa thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    }
};

module.exports = chitietdonhangController;