import { createClient } from 'redis'

import { RedisConfig } from '@/app/config'

export type RedisClient = ReturnType<typeof createClient>

export const createRedisClient = (config: RedisConfig) => createClient({
    url: `redis://:${config.redisPassword}@${config.redisHost}:${config.redisPort}`,
})
