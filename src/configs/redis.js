const Redis = require("redis");

const client = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
});


client.on("error", (err) => console.error("❌ [REDIS] Lỗi kết nối:", err));

// Kích hoạt kết nối tự động bất đồng bộ
(async () => {
  try {
    await client.connect();
  } catch (error) {
    console.error("❌ Không thể kết nối Redis khi khởi động:", error);
  }
})();

module.exports = client;