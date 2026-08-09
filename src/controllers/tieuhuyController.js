const TieuHuyModel = require('../models/tieuhuyModel');
const db = require('../configs/db');
const response = require('../utils/response');
const redisFunc = require('../utils/redisFunc');

const cacheKey2 = 'lothuoc';
const cacheKey = 'phieutieuhuy';

const tieuhuyController = {
    getAll: async (req, res) => {
        try {
            const cachedData = await redisFunc.getFromCache(cacheKey);
            if (cachedData) {
                return response.ok(res, cachedData, "Lấy danh sách phiếu tiêu hủy thành công");
            }

            const phieuTieuHuy = await TieuHuyModel.getAll();
            await redisFunc.addToCache(cacheKey, phieuTieuHuy);
            return response.ok(res, phieuTieuHuy, "Lấy danh sách phiếu tiêu hủy thành công");
        } catch (error) {
            console.error("Lỗi lấy danh sách phiếu tiêu hủy:", error);
            return response.error(res, "Lỗi server");
        }
    },

    getById: async (req, res) => {
        try {
            const { maphieutieuhuy } = req.params;
            const phieu = await TieuHuyModel.getById(maphieutieuhuy);
            if (!phieu) return response.error(res, 'Không tìm thấy phiếu', 404);
            
            const chitiet = await TieuHuyModel.getChiTiet(maphieutieuhuy);
            phieu.chitiet = chitiet;
            
            return response.ok(res, phieu, "Lấy chi tiết thành công");
        } catch (error) {
            console.error("Lỗi lấy chi tiết phiếu tiêu hủy:", error);
            return response.error(res, "Lỗi server");
        }
    },

    create: async (req, res) => {
        try {
            const { maphieutieuhuy, maphieukiemke, ngaylap, nguoilap, chitiet } = req.body;
            
            if (!chitiet || chitiet.length === 0) return response.error(res, 'Chi tiết không được rỗng', 400);

            await TieuHuyModel.create({ maphieutieuhuy, maphieukiemke, ngaylap, nguoilap, trangthai: 'nhap' });
            await TieuHuyModel.addChiTiet(maphieutieuhuy, chitiet, maphieukiemke);
            await redisFunc.deleteCache(cacheKey2); // Xóa cache lô thuốc vì tonkhadung đã thay đổi
            await redisFunc.deleteCache(cacheKey); // Xóa cache phiếu tiêu hủy
            return response.created(res, { maphieutieuhuy }, "Tạo phiếu tiêu hủy thành công");
        } catch (error) {
            console.error("Lỗi tạo phiếu:", error);
            if (error.code === 'ER_DUP_ENTRY') return response.error(res, 'Mã phiếu đã tồn tại', 400);
            if (error.message && (error.message.startsWith('Lô ') || error.message.startsWith('Không '))) {
                return response.error(res, error.message, 400);
            }
            return response.error(res, "Lỗi server");
        }
    },

    update: async (req, res) => {
        try {
            const { maphieutieuhuy } = req.params;
            const { lydo_quyetdinh, thoigian_dukien, phuongtieuhuy, donvi_xuly } = req.body;
            const result = await TieuHuyModel.update(maphieutieuhuy, { lydo_quyetdinh, thoigian_dukien, phuongtieuhuy, donvi_xuly });
            if (result.affectedRows === 0) return response.error(res, 'Không tìm thấy phiếu', 404);
            await redisFunc.deleteCache(cacheKey);
            await redisFunc.deleteCache(cacheKey2);
            return response.ok(res, null, "Cập nhật thành công");
        } catch (error) {
            console.error("Lỗi cập nhật phiếu:", error);
            return response.error(res, "Lỗi server");
        }
    },

    approve: async (req, res) => {
        try {
            const { maphieutieuhuy } = req.params;
            const { nguoiduyet, nguoichungkien, trangthai } = req.body; // daduyet or dahuy
            
            await TieuHuyModel.approve(maphieutieuhuy, { nguoiduyet, nguoichungkien, trangthai });
            await redisFunc.deleteCache(cacheKey2); // Xóa cache lô thuốc vì tonthucte đã thay đổi
            await redisFunc.deleteCache(cacheKey); // Xóa cache phiếu tiêu hủy
            await db.query('COMMIT');
            return response.ok(res, null, "Duyệt phiếu tiêu hủy thành công");
        } catch (error) {
            await db.query('ROLLBACK');
            console.error("Lỗi duyệt phiếu:", error);
            return response.error(res, "Lỗi server khi duyệt phiếu");
        }
    },

    delete: async (req, res) => {
        try {
            const { maphieutieuhuy } = req.params;
            await TieuHuyModel.delete(maphieutieuhuy);
            await redisFunc.deleteCache(cacheKey2); // Xóa cache lô thuốc vì tonkhadung được hoàn lại
            await redisFunc.deleteCache(cacheKey); // Xóa cache phiếu tiêu hủy
            return response.ok(res, null, "Xóa phiếu tiêu hủy thành công");
        } catch (error) {
            console.error("Lỗi xóa phiếu tiêu hủy:", error);
            return response.error(res, "Lỗi server");
        }
    }
};

module.exports = tieuhuyController;
