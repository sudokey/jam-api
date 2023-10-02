import 'module-alias/register'
import Fastify from 'fastify'

import { createConfig } from '@/app/config'
import { createDataSource } from '@/app/data/data-source'
import { createRedisClient } from '@/app/data/redis'
import { createCode } from '@/app/routes/code'
import { createSmtpTransporter } from '@/app/misc/mailer'
import { createToken } from '@/app/routes/token'
import { getUser } from '@/app/routes/uset'

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
fastify.post('/api/v1/user', getUser(redisClient)(dataSource)(config));

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
