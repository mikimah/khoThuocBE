const LoThuocModel = require("../models/lothuocModel");
const ThuocModel = require("../models/thuocModel");
const vitrikhoModel = require("../models/vitrikhoModel");
const response = require("../utils/response");
const redisFunc = require('../utils/redisFunc');

const cacheKey = 'lothuoc';

const attachHttpMeta = (error) => {
  if (error && error.code === "ER_DUP_ENTRY") {
    error.statusCode = 409;
    error.message = "Mã số lô thuốc này đã tồn tại trong hệ thống";
  }
  return error;
};

const LoThuocController = {
  getAllLoThuoc: async (req, res, next) => {
    try {
      const cacheData = await redisFunc.getFromCache(cacheKey);
      if (cacheData) {
        return response.ok(res, cacheData, "Lấy danh sách lô thuốc thành công (từ cache)");
      }
      const data = await LoThuocModel.getAll();
      await redisFunc.addToCache(cacheKey, data);
      return response.ok(res, data, "Lấy danh sách lô thuốc thành công");
    } catch (error) {
      return next(attachHttpMeta(error));
    }
  },

  getLoByThuoc: async (req, res, next) => {
    try {
      const { mathuoc } = req.params;
      const data = await LoThuocModel.getByThuocId(mathuoc);
      return response.ok(res, data, "Lấy lô thuốc theo mã thuốc thành công");
    } catch (error) {
      return next(attachHttpMeta(error));
    }
  },

  // NGHIỆP VỤ NHẬP KHO CHẶN LỖI GDP BIẾN THÔNG SỐ CHUỖI THÀNH ENUM
  createLoThuoc: async (req, res, next) => {
    try {
      const { mathuoc, mavitri, tonthucte } = req.body;

      if (!mathuoc || !mavitri || tonthucte == null) {
        return response.badRequest(
          res,
          "Thiếu thông tin bắt buộc: mathuoc, mavitri, tonthucte",
        );
      }

      // 1. Kiểm tra điều kiện bảo quản của Thuốc
      const thuocRows = await ThuocModel.getById(mathuoc);
      if (thuocRows.length === 0)
        return response.notFound(res, "Không tìm thấy mã thuốc này");

      // 2. Kiểm tra loại khu vực của Kệ kho được chọn
      const vitriRows = await vitrikhoModel.getById(mavitri);
      if (vitriRows.length === 0)
        return response.notFound(res, "Không tìm thấy vị trí kệ kho đã chọn");

      const loaiBaoQuanThuoc = String(thuocRows[0].loai_baoquan || "").trim().toLowerCase();
      const loaiBaoQuanViTri = String(vitriRows[0].loai_baoquan || "").trim().toLowerCase();

      // Khu vực biệt trữ (quarantine) được phép tiếp nhận mọi loại thuốc bất chấp GDP
      const isBietTru = loaiBaoQuanViTri === "biệt trữ" || loaiBaoQuanViTri === "biettru";

      if (isBietTru) {
        req.body.trangthai = "biettru";
      } else if (loaiBaoQuanThuoc !== loaiBaoQuanViTri) {
        return response.badRequest(
          res,
          `Vi phạm tiêu chuẩn GDP: Thuốc yêu cầu bảo quản dạng [${thuocRows[0].loai_baoquan}], không thể xếp vào vị trí thuộc khu vực [${vitriRows[0].loai_baoquan}]!`,
        );
      }

      // Đồng bộ: Đảm bảo lúc mới nhập kho, Tồn khả dụng luôn bằng Tồn thực tế
      req.body.tonkhadung = tonthucte;

      const result = await LoThuocModel.create(req.body);
      await redisFunc.deleteCache(cacheKey); // Xóa cache sau khi tạo mới
      return response.created(
        res,
        { malo_moi: result.insertId },
        "Nhập lô thuốc vào vị trí kệ thành công",
      );
    } catch (error) {
      return next(attachHttpMeta(error));
    }
  },

  updateLoThuoc: async (req, res, next) => {
    try {
      const { malo } = req.params;
      const { mavitri, mathuoc, trangthai } = req.body;

      const current = await LoThuocModel.getById(malo);
      if (current.length === 0)
        return response.notFound(res, "Không tìm thấy mã lô");

      const currentViTri = current[0].mavitri;

      if (mavitri && mathuoc) {
        const thuocRows = await ThuocModel.getById(mathuoc);
        const vitriRows = await vitrikhoModel.getById(mavitri);
        if (thuocRows.length > 0 && vitriRows.length > 0) {
          const loaiBaoQuanThuoc = String(thuocRows[0].loai_baoquan || "").trim().toLowerCase();
          const loaiBaoQuanViTri = String(vitriRows[0].loai_baoquan || "").trim().toLowerCase();
          const isBietTru = loaiBaoQuanViTri === "biệt trữ" || loaiBaoQuanViTri === "biettru";

          if (isBietTru) {
            // Chặn lỗi: Đang ở Biệt trữ mà đòi chuyển trạng thái sang Sẵn sàng bán nhưng không dời đi kệ khác
            if (mavitri === currentViTri && trangthai === "sansangban") {
              return response.badRequest(
                res,
                "Không thể chuyển trạng thái sang Sẵn sàng bán khi lô thuốc vẫn đang nằm trên kệ Biệt trữ!",
              );
            }
            req.body.trangthai = "biettru";
          } else if (loaiBaoQuanThuoc !== loaiBaoQuanViTri) {
            return response.badRequest(
              res,
              "Không thể điều chuyển lô thuốc sang kệ này vì lệch chuẩn bảo quản GDP!",
            );
          }
        }
      }

      if (
        req.body &&
        (req.body.tonkhadung != null || req.body.tonthucte != null)
      ) {
        const tonthucte = Number(
          req.body.tonthucte != null
            ? req.body.tonthucte
            : current[0].tonthucte,
        );
        const tonkhadung = Number(
          req.body.tonkhadung != null
            ? req.body.tonkhadung
            : current[0].tonkhadung,
        );

        if (tonkhadung > tonthucte) {
          return response.badRequest(
            res,
            "Ràng buộc logic: Tồn khả dụng không được vượt quá tồn thực tế vật lý",
          );
        }
      }

      const result = await LoThuocModel.update(malo, req.body);
      if (result.affectedRows === 0)
        return response.notFound(res, "Không tìm thấy lô thuốc cần cập nhật");

      await redisFunc.deleteCache(cacheKey); // Xóa cache sau khi cập nhật
      return response.ok(res, null, "Cập nhật thông tin lô thuốc thành công");
    } catch (error) {
      return next(attachHttpMeta(error));
    }
  },

  deleteLoThuoc: async (req, res, next) => {
    try {
      const { malo } = req.params;
      const result = await LoThuocModel.delete(malo);
      if (result.affectedRows === 0)
        return response.notFound(res, "Không tìm thấy lô thuốc để xóa");

      await redisFunc.deleteCache(cacheKey); // Xóa cache sau khi xóa
      return response.ok(res, null, "Xóa lô thuốc ra khỏi hệ thống thành công");
    } catch (error) {
      return next(attachHttpMeta(error));
    }
  },
};

module.exports = LoThuocController;
