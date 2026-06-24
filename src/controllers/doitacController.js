const DoiTacModel = require('../models/doitacModel');
const response = require('../utils/response');

const attachHttpMeta = (error) => {
    if (error && error.code === 'ER_DUP_ENTRY') {
        error.statusCode = 409;
        error.message = 'Đối tác đã tồn tại';
    }
    return error;
};

const DoiTacController = {
    // Lấy tất cả
    getAllDoiTac: async (req, res, next) => {
        try {
            const data = await DoiTacModel.getAll();
            return response.ok(res, data, 'Lấy danh sách đối tác thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },

    // Lấy chi tiết 1 đối tác
    getDoiTacById: async (req, res, next) => {
        try {
            const { id } = req.params;
            const data = await DoiTacModel.getById(id);
            if (data.length === 0) return response.notFound(res, 'Không tìm thấy đối tác');
            return response.ok(res, data[0], 'Lấy đối tác thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },

    // Lọc theo Loại (Nhà cung cấp / Khách hàng)
    getDoiTacByLoai: async (req, res, next) => {
        try {
            const { loaidoitac } = req.params;
            const data = await DoiTacModel.getByLoai(loaidoitac);
            return response.ok(res, data, 'Lọc đối tác thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },

    // Thêm mới
    createDoiTac: async (req, res, next) => {
        try {
            if (!req.body.tendoitac || !req.body.loaidoitac) {
                return response.badRequest(res, 'Tên và Loại đối tác là bắt buộc');
            }

            if (!req.body.diachi || String(req.body.diachi).trim() === '') {
                return response.badRequest(res, 'Địa chỉ không được để trống');
            }

            const rawPhone = (req.body.sodienthoai || '').trim();
            const sodienthoai = rawPhone ? rawPhone.replace(/\D/g, '') : '';
            const email = (req.body.email || '').trim();

            if (!sodienthoai || !email) {
                return response.badRequest(res, 'Số điện thoại và email không được để trống');
            }

            if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
                return response.badRequest(res, 'Email phải có tên miền sau @');
            }

            if (sodienthoai && !/^(\d{8}|\d{10})$/.test(sodienthoai)) {
                return response.badRequest(res, 'Số điện thoại phải có 8 hoặc 10 chữ số');
            }

            req.body.sodienthoai = sodienthoai || null;
            req.body.email = email || null;
            const existed = await DoiTacModel.findByPhoneOrEmail(sodienthoai, email);
            if (existed.length > 0) {
                return response.conflict(res, 'Số điện thoại hoặc email đã tồn tại');
            }
            const result = await DoiTacModel.create(req.body);
            return response.created(res, { id_moi: result.insertId }, 'Thêm đối tác thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },

    // Cập nhật
    updateDoiTac: async (req, res, next) => {
        try {
            const { id } = req.params;

            const rawPhone = (req.body.sodienthoai || '').trim();
            const sodienthoai = rawPhone ? rawPhone.replace(/\D/g, '') : '';
            const email = (req.body.email || '').trim();

            if (!sodienthoai || !email) {
                return response.badRequest(res, 'Số điện thoại và email không được để trống');
            }

            if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
                return response.badRequest(res, 'Email phải có tên miền sau @');
            }

            if (sodienthoai && !/^(\d{8}|\d{10})$/.test(sodienthoai)) {
                return response.badRequest(res, 'Số điện thoại phải có 8 hoặc 10 chữ số');
            }

            req.body.sodienthoai = sodienthoai || null;
            req.body.email = email || null;
            const existed = await DoiTacModel.findByPhoneOrEmail(sodienthoai, email, id);
            if (existed.length > 0) {
                return response.conflict(res, 'Số điện thoại hoặc email đã tồn tại');
            }
            const result = await DoiTacModel.update(id, req.body);
            if (result.affectedRows === 0) return response.notFound(res, 'Không tìm thấy đối tác');
            return response.ok(res, null, 'Cập nhật thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },

    // Xóa
    deleteDoiTac: async (req, res, next) => {
        try {
            const { id } = req.params;

            const requesterId = req.user?.id;
            if (String(requesterId) !== '0' && String(requesterId) !== '1') {
                return response.forbidden(res, 'Chỉ Admin gốc (ID 0 hoặc 1) mới được phép xóa');
            }
            const result = await DoiTacModel.delete(id);
            if (result.affectedRows === 0) return response.notFound(res, 'Không tìm thấy đối tác');
            return response.ok(res, null, 'Xóa thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    }
};

module.exports = DoiTacController;