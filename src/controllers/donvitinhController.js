const donvitinhModel = require('../models/donvitinhModel');
const response = require('../utils/response');

const attachHttpMeta = (error) => {
    if (error && error.code === 'ER_DUP_ENTRY') {
        error.statusCode = 409;
        error.message = 'Đơn vị tính đã tồn tại';
    }
    return error;
};

const donvitinhController = {
    getAll: async (req, res, next) => {
        try {
            const data = await donvitinhModel.getAll();
            return response.ok(res, data, 'Lấy danh sách đơn vị tính thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },

    getByThuoc: async (req, res, next) => {
        try {
            const { mathuoc } = req.params;
            const data = await donvitinhModel.getByThuocId(mathuoc);
            return response.ok(res, data, 'Lấy đơn vị tính theo thuốc thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },

    create: async (req, res, next) => {
        try {
            const { tendonvi, hesoquydoi, mathuoc } = req.body;

            // 🔥 ĐỒNG BỘ: Dùng isExist (trả về true/false)
            const isExist = await donvitinhModel.checkDuplicate(tendonvi, mathuoc);
            if (isExist) {
                return response.conflict(res, `Đơn vị '${tendonvi}' đã tồn tại cho thuốc này!`);
            }

            const result = await donvitinhModel.create(req.body);
            return response.created(res, { id_moi: result.insertId }, 'Thêm thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },

    update: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { tendonvi, hesoquydoi, mathuoc } = req.body;

            // 🔥 ĐỒNG BỘ: Dùng isExist có loại trừ ID
            const isExist = await donvitinhModel.checkDuplicate(tendonvi, mathuoc, id);
            if (isExist) {
                return response.conflict(res, `Đơn vị '${tendonvi}' đã tồn tại cho thuốc này!`);
            }

            const result = await donvitinhModel.update(id, req.body);
            if (result.affectedRows === 0) return response.notFound(res, 'Không tìm thấy đơn vị tính');
            return response.ok(res, null, 'Cập nhật thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },

    delete: async (req, res, next) => {
        try {
            const { id } = req.params;
            const result = await donvitinhModel.delete(id);
            if (result.affectedRows === 0) return response.notFound(res, 'Không tìm thấy đơn vị tính');
            return response.ok(res, null, 'Xóa thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    }
};

module.exports = donvitinhController;