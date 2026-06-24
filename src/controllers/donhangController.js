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
   // Tra cứu đơn hàng công khai
    traCuuCongKhai: async (req, res, next) => {
        try {
            const { sodienthoai, mavandon3pl } = req.body || {};
            if (!sodienthoai && !mavandon3pl) {
                return response.badRequest(res, 'Thiếu số điện thoại hoặc mã vận đơn');
            }

            const masterRows = await donhangModel.getPublicByTrackingOrPhone(mavandon3pl, sodienthoai);
            if (masterRows.length === 0) {
                return response.notFound(res, 'Không tìm thấy đơn hàng hoặc số điện thoại/mã vận đơn không chính xác');
            }

            // ĐÃ SỬA: Lấy mã đơn hàng từ kết quả truy vấn masterRows ở trên
            const madonhang_tim_thay = masterRows[0].madonhang;

            // Dùng mã tìm được để kéo danh sách chi tiết
            const chitiet = await donhangModel.getPublicDetails(madonhang_tim_thay);
            
            return response.ok(res, { ...masterRows[0], chitiet }, 'Tra cứu đơn hàng thành công');
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