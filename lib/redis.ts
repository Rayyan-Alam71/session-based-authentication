import * as dotenv from "dotenv"
import { createClient } from "redis";

dotenv.config()

export const redis = createClient({
    url : process.env.REDIS_URL!
})

await redis.connect()