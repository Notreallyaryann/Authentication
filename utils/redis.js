
import { createClient } from "redis";

const redisClient = createClient({
  username: "default",
  password: process.env.REDIS_PASS,
  socket: {
    host: "redis-18618.c9.us-east-1-4.ec2.redns.redis-cloud.com",
    port: 18618,
  },
});

redisClient.on("connect", () => {
  console.log("Connected to Redis");
});

redisClient.on("error", (err) => {
  console.error("Redis error:", err.message);
});

const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (err) {
    console.error(" Failed to connect Redis:", err.message);
    process.exit(1);
  }
};

export { redisClient, connectRedis };
