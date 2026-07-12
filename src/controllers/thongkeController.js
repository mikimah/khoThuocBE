const thongkeModel = require('../models/thongkeModel');
const response = require('../utils/response');

const getDateRange = (req) => {
    const { tuNgay, denNgay } = req.query || {};

    const now = new Date();
    const startDefault = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDefault = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const startDate = tuNgay ? new Date(`${tuNgay}T00:00:00`) : startDefault;
    const endDate = denNgay ? new Date(`${denNgay}T23:59:59`) : new Date(endDefault.getFullYear(), endDefault.getMonth(), endDefault.getDate(), 23, 59, 59);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        return { error: 'Định dạng ngày không hợp lệ (yyyy-mm-dd)' };
    }

    if (startDate > endDate) {
        return { error: 'Từ ngày phải nhỏ hơn hoặc bằng Đến ngày' };
    }

    const toSqlDateTime = (date) => date.toISOString().slice(0, 19).replace('T', ' ');

    return {
        tuNgay: toSqlDateTime(startDate),
        denNgay: toSqlDateTime(endDate)
    };
};

const thongkeController = {
    getTongQuan: async (req, res, next) => {
        try {
            const range = getDateRange(req);
            if (range.error) return response.badRequest(res, range.error);

            const { madoitac, mathuoc } = req.query || {};
            const data = await thongkeModel.getTongQuan(range.tuNgay, range.denNgay, madoitac, mathuoc);
            return response.ok(res, data, 'Lấy thống kê tổng quan thành công');
        } catch (error) {
            return next(error);
        }
    },

    getBieuDo: async (req, res, next) => {
        try {
            const range = getDateRange(req);
            if (range.error) return response.badRequest(res, range.error);

            const { madoitac, mathuoc } = req.query || {};
            const data = await thongkeModel.getBieuDo(range.tuNgay, range.denNgay, madoitac, mathuoc);
            return response.ok(res, data, 'Lấy dữ liệu biểu đồ thành công');
        } catch (error) {
            return next(error);
        }
    },

    getChiTiet: async (req, res, next) => {
        try {
            const range = getDateRange(req);
            if (range.error) return response.badRequest(res, range.error);

            const { madoitac, mathuoc } = req.query || {};
            const data = await thongkeModel.getChiTiet(range.tuNgay, range.denNgay, madoitac, mathuoc);
            return response.ok(res, data, 'Lấy dữ liệu chi tiết giao dịch thành công');
        } catch (error) {
            return next(error);
        }
    }
};

module.exports = thongkeController;
