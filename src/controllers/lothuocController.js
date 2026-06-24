const LoThuocModel = require("../models/lothuocModel");
const ThuocModel = require("../models/thuocModel");
const vitrikhoModel = require("../models/vitrikhoModel");
const response = require("../utils/response");

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
      const data = await LoThuocModel.getAll();
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

      const loaiBaoQuanThuoc = thuocRows[0].loai_baoquan;
      const loaiBaoQuanViTri = vitriRows[0].loai_baoquan;

      // 🔥 THUẬT TOÁN KIỂM TRA GDP KHỚP MÃ TOÀN VẸN
      if (loaiBaoQuanThuoc !== loaiBaoQuanViTri) {
        return response.badRequest(
          res,
          `Vi phạm tiêu chuẩn GDP: Thuốc yêu cầu bảo quản dạng [${loaiBaoQuanThuoc}], không thể xếp vào vị trí thuộc khu vực [${loaiBaoQuanViTri}]!`,
        );
      }

      // Đồng bộ: Đảm bảo lúc mới nhập kho, Tồn khả dụng luôn bằng Tồn thực tế
      req.body.tonkhadung = tonthucte;

      const result = await LoThuocModel.create(req.body);
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
      const { mavitri, mathuoc } = req.body;

      // Nếu có sự thay đổi vị trí kệ khi đang vận hành kho, phải kiểm tra lại GDP chéo
      if (mavitri && mathuoc) {
        const thuocRows = await ThuocModel.getById(mathuoc);
        const vitriRows = await vitrikhoModel.getById(mavitri);
        if (thuocRows.length > 0 && vitriRows.length > 0) {
          if (thuocRows[0].loai_baoquan !== vitriRows[0].loai_baoquan) {
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
        const current = await LoThuocModel.getById(malo);
        if (current.length === 0)
          return response.notFound(res, "Không tìm thấy mã lô");
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
      return response.ok(res, null, "Xóa lô thuốc ra khỏi hệ thống thành công");
    } catch (error) {
      return next(attachHttpMeta(error));
    }
  },
};

module.exports = LoThuocController;
