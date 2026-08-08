const redis = require('../configs/redis');


const redisFunc = {
  addToCache,
  getFromCache,
  deleteCache
}

async function addToCache(key, value) {
    // Tạm thời vô hiệu hóa Redis
    return;
    // await redis.set(key, JSON.stringify(value));
    // return redis.expire(key, process.env.REDIS_EXPIRES_IN);
}

function getFromCache(key) {
  // Tạm thời vô hiệu hóa Redis, luôn trả về null để bắt buộc query DB
  return Promise.resolve(null);
  
  // return redis.get(key).then((data) => {
  //     if (data) {
  //         return JSON.parse(data);
  //     }
  //     return null;
  // });
}

function deleteCache(key) {
  // Tạm thời vô hiệu hóa Redis
  return Promise.resolve();
  
  // return redis.del(key);
}

module.exports = redisFunc;