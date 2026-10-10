const { createClient } = require("redis"); 
const redis = createClient({
    url: process.env.REDIS || "redis://localhost:6379"
}); 

redis.on("error", (error) => {
    console.log("Redis error: ", error);
}); 

const connectRedis = async () => {
    await redis.connect(); 
    console.log("Redis connected successfully."); 
}; 

module.exports = {
    redis, 
    connectRedis
}; 