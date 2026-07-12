const donhangModel = require('../models/donhangModel');
const response = require('../utils/response');

const attachHttpMeta = (error) => {
    if (error && error.code === 'ER_DUP_ENTRY') {
        error.statusCode = 409;
        error.message = 'Đơn hàng đã tồn tại';
    }
    return error;
};

const donhangController = {
    // Lấy tất cả
    getAllDonHang: async (req, res, next) => {
        try {
            const data = await donhangModel.getAll();
            return response.ok(res, data, 'Lấy danh sách đơn hàng thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },

    // Lấy đơn của chính mình (theo mataikhoan từ token)
    getDonHangCuaToi: async (req, res, next) => {
        try {
            const mataikhoan = req.user?.id;
            if (!mataikhoan) return response.unauthorized(res, 'Không xác thực được tài khoản');
            const data = await donhangModel.getByTaiKhoan(mataikhoan);
            return response.ok(res, data, 'Lấy lịch sử đơn hàng thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },

    // Lấy 1 đơn
    getDonHangById: async (req, res, next) => {
        try {
            const { id } = req.params;
            const data = await donhangModel.getById(id);
            if (data.length === 0) return response.notFound(res, 'Không tìm thấy đơn hàng');
            return response.ok(res, data[0], 'Lấy đơn hàng thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },

    // Lọc theo Loại (Nhập/Xuất)
    getDonHangByLoai: async (req, res, next) => {
        try {
            const { loaidonhang } = req.params;
            const data = await donhangModel.getByLoai(loaidonhang);
            return response.ok(res, data, 'Lọc đơn hàng thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },

    // Tạo đơn hàng mới
    createDonHang: async (req, res, next) => {
        try {
            const { loaidonhang, sohoadongtgt } = req.body || {};
            if (String(loaidonhang || '').trim().toLowerCase() === 'nhap') {
                const soHoaDon = String(sohoadongtgt || '').trim();
                if (!soHoaDon) {
                    return response.badRequest(res, 'Số hóa đơn GTGT là bắt buộc đối với Phiếu Nhập!');
                }
            }
            const result = await donhangModel.create(req.body);
            return response.created(res, { madonhang_moi: result.insertId }, 'Tạo đơn hàng thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },

    // Tra cứu đơn hàng công khai
    traCuuCongKhai: async (req, res, next) => {
        try {
            const {  mavandon3pl } = req.body || {};
            if (!mavandon3pl) {
                return response.badRequest(res, 'Thiếu mã vận đơn');
            }

            // Bỏ tìm theo SĐT
            const masterRows = await donhangModel.getPublicByTrackingOrPhone(mavandon3pl, null);
            if (masterRows.length === 0) {
                return response.notFound(res, 'Không tìm thấy mã vận đơn này!');
            }

            const order = masterRows[0];
            const madonhang_tim_thay = order.madonhang;

            // Masking tên đối tác (Ví dụ: "Nhà thuốc A" -> "N** t**** A")
            if (order.tendoitac) {
                const words = order.tendoitac.split(' ');
                order.tendoitac = words.map(w => w.length > 1 ? w[0] + '*'.repeat(w.length - 1) : w).join(' ');
            }
            
            // Xóa SĐT và địa chỉ khỏi response để bảo mật
            delete order.sodienthoai;
            delete order.diachi;

            // Dùng mã tìm được để kéo danh sách chi tiết
            const chitiet = await donhangModel.getPublicDetails(madonhang_tim_thay);
            
            return response.ok(res, { ...order, chitiet }, 'Tra cứu đơn hàng thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },

    // Đổi trạng thái (VD: Duyệt đơn, Hủy đơn)
    updateTrangThai: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { trangthai } = req.body; // FE chỉ cần gửi { "trangthai": "daduyet" }
            
            if(!trangthai) return response.badRequest(res, 'Thiếu dữ liệu trạng thái');

            const result = await donhangModel.updateStatusWithBusinessLogic(id, trangthai);
            if (result.affectedRows === 0) return response.notFound(res, 'Không tìm thấy đơn hàng');
            
            return response.ok(res, null, `Đã chuyển trạng thái thành: ${trangthai}`);
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },

    // Cập nhật thông tin đơn (Giá trị, ghi chú...)
    updateDonHang: async (req, res, next) => {
        try {
            const { id } = req.params;
            const result = await donhangModel.update(id, req.body);
            if (result.affectedRows === 0) return response.notFound(res, 'Không tìm thấy đơn hàng');
            return response.ok(res, null, 'Cập nhật thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    },

    // Xóa đơn
    deleteDonHang: async (req, res, next) => {
        try {
            const { id } = req.params;
            const result = await donhangModel.delete(id);
            if (result.affectedRows === 0) return response.notFound(res, 'Không tìm thấy đơn hàng');
            return response.ok(res, null, 'Xóa thành công');
        } catch (error) {
            return next(attachHttpMeta(error));
        }
    }
};

module.exports = donhangController;