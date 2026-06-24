const ThuocModel = require('../models/thuocModel');
const response = require('../utils/response');

const attachHttpMeta = (error) => {
    if (error && error.code === 'ER_DUP_ENTRY') {
        error.statusCode = 409;
        error.message = 'Thuốc đã tồn tại';
    }
    return error;
};

const ThuocController = {
    getAll: async (req, res, next) => {
        try {
            const data = await ThuocModel.getAll();
            return response.ok(res, data, 'Lấy danh sách thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },

    getById: async (req, res, next) => {
        try {
            const { id } = req.params;
            const data = await ThuocModel.getById(id);
            
            if (data.length === 0) return response.notFound(res, 'Không tìm thấy thuốc này');
            return response.ok(res, data[0], 'Tìm thấy dữ liệu');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },

    create: async (req, res, next) => {
        try {
            const newThuocData = req.body;
            
            if (!newThuocData.tenthuoc) {
                return response.badRequest(res, 'Tên thuốc không được để trống');
            }

            // 🔥 ĐỒNG BỘ: Dùng isExist
            const isExist = await ThuocModel.checkDuplicate(newThuocData.tenthuoc);
            if (isExist) {
                return response.conflict(res, 'Tên thuốc đã tồn tại');
            }

            const result = await ThuocModel.create(newThuocData);
            return response.created(res, { id: result.insertId, ...newThuocData }, 'Thêm mới thuốc thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },

    update: async (req, res, next) => {
        try {
            const { id } = req.params;
            const updateData = req.body;

            if (updateData.tenthuoc) {
                // 🔥 ĐỒNG BỘ: Dùng isExist có loại trừ ID hiện tại
                const isExist = await ThuocModel.checkDuplicate(updateData.tenthuoc, id);
                if (isExist) {
                    return response.conflict(res, 'Tên thuốc đã tồn tại');
                }
            }
            
            const shouldLockLo = Number(updateData.trangthai) === 0;
            const result = shouldLockLo
                ? await ThuocModel.updateStatusWithLock(id, updateData)
                : await ThuocModel.update(id, updateData);
            if (result.affectedRows === 0) return response.notFound(res, 'Không tìm thấy thuốc để cập nhật');

            return response.ok(res, null, 'Cập nhật thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },

    delete: async (req, res, next) => {
        try {
            const { id } = req.params;
            const result = await ThuocModel.delete(id);

            if (result.affectedRows === 0) return response.notFound(res, 'Không tìm thấy thuốc để xóa');
            return response.ok(res, null, 'Xóa thuốc thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    }
};

module.exports = ThuocController;