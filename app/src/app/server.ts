import 'module-alias/register'
import Fastify from 'fastify'

import { createConfig } from '@/app/config'
import { createDataSource } from '@/app/data/data-source'
import { createRedisClient } from '@/app/data/redis'
import { createCodeRoute } from '@/app/routes/code'
import { createSmtpTransporter } from '@/app/misc/mailer'

const { fastifyFunky } = require('@fastify/funky')

const config = createConfig()

const dataSource = createDataSource(config)

const redisClient = createRedisClient(config)

const smtpTransporter = createSmtpTransporter(config)

const fastify = Fastify({
    logger: true,
})

fastify.register(fastifyFunky)

fastify.post('/api/v1/code', createCodeRoute(smtpTransporter, config, redisClient));

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
