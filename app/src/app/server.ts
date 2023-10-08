import 'module-alias/register'
import Fastify from 'fastify'

import { createConfig } from '@/app/config'
import { createDataSource } from '@/app/data/data-source'
import { createRedisClient } from '@/app/data/redis'
import { createCode } from '@/app/routes/code'
import { createSmtpTransporter } from '@/app/misc/mailer'
import { createToken } from '@/app/routes/token'
import { getUserRoute, updateUserRoute } from '@/app/routes/uset'
import { createTimerRoute, stopTimerRoute, timersRoute } from '@/app/routes/timer'

const { fastifyFunky } = require('@fastify/funky')

const config = createConfig()

const dataSource = createDataSource(config)

const redisClient = createRedisClient(config)

const smtpTransporter = createSmtpTransporter(config)

const fastify = Fastify({
    logger: true,
})

fastify.register(fastifyFunky)

fastify.post('/api/v1/code', createCode(smtpTransporter)(config)(redisClient))
fastify.post('/api/v1/token', createToken(config)(dataSource)(redisClient))
fastify.get('/api/v1/user', getUserRoute(redisClient)(dataSource)(config))
fastify.post('/api/v1/user', updateUserRoute(redisClient)(dataSource)(config))
fastify.post('/api/v1/timer', createTimerRoute(dataSource)(redisClient)(config))
fastify.post('/api/v1/timer/stop', stopTimerRoute(dataSource)(redisClient)(config))
fastify.get('/api/v1/timers', timersRoute(dataSource)(redisClient)(config));

(async () => {
    try {
        await redisClient.connect()
        await dataSource.initialize()
        await fastify.listen({
            port: config.port,
            host: config.host,
        })
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
})()
