const LoThuocModel = require('../models/lothuocModel');
const response = require('../utils/response');

const attachHttpMeta = (error) => {
    if (error && error.code === 'ER_DUP_ENTRY') {
        error.statusCode = 409;
        error.message = 'Lô thuốc đã tồn tại';
    }
    return error;
};

const LoThuocController = {
    // Lấy tất cả lô thuốc
    getAllLoThuoc: async (req, res, next) => {
        try {
            const data = await LoThuocModel.getAll();
            return response.ok(res, data, 'Lấy danh sách lô thuốc thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },

    // Lấy các lô của 1 loại thuốc
    getLoByThuoc: async (req, res, next) => {
        try {
            const { mathuoc } = req.params;
            const data = await LoThuocModel.getByThuocId(mathuoc);
            return response.ok(res, data, 'Lấy lô thuốc theo thuốc thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },

    // Thêm lô mới (Nghiệp vụ nhập kho)
    createLoThuoc: async (req, res, next) => {
        try {
            const newLo = req.body;
            // Tự động gán tồn khả dụng = tồn thực tế nếu FE không gửi lên
            if (newLo.tonkhadung === undefined) {
                newLo.tonkhadung = newLo.tonthucte;
            }
            
            const result = await LoThuocModel.create(newLo);
            return response.created(res, { id_moi: result.insertId }, 'Thêm lô thuốc thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },

    // Cập nhật lô thuốc
    updateLoThuoc: async (req, res, next) => {
        try {
            const { malo } = req.params;
            const hasTrangThai = Object.prototype.hasOwnProperty.call(req.body || {}, 'trangthai');

            if (hasTrangThai) {
                const thuocRows = await LoThuocModel.getThuocTrangThaiByLo(malo);
                if (thuocRows.length > 0 && Number(thuocRows[0].trangthai) === 0) {
                    return response.conflict(res, 'Do thuốc trong lô đang ngừng kinh doanh');
                }
            }

            if (req.body && (req.body.tonkhadung != null || req.body.tonthucte != null)) {
                const current = await LoThuocModel.getById(malo);
                if (current.length === 0) return response.notFound(res, 'Không tìm thấy lô');
                const tonthucte = Number(req.body.tonthucte != null ? req.body.tonthucte : current[0].tonthucte);
                const tonkhadung = Number(req.body.tonkhadung != null ? req.body.tonkhadung : current[0].tonkhadung);

                if (tonkhadung > tonthucte) {
                    return response.badRequest(res, 'Tồn khả dụng không được vượt tồn thực tế');
                }
            }
            const result = await LoThuocModel.update(malo, req.body);
            if (result.affectedRows === 0) return response.notFound(res, 'Không tìm thấy lô');
            return response.ok(res, null, 'Cập nhật thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },

    // Xóa lô thuốc
    deleteLoThuoc: async (req, res, next) => {
        try {
            const { malo } = req.params;
            const result = await LoThuocModel.delete(malo);
            if (result.affectedRows === 0) return response.notFound(res, 'Không tìm thấy lô');
            return response.ok(res, null, 'Xóa thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    }
};

module.exports = LoThuocController;