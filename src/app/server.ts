import 'module-alias/register'

import { IO } from 'fp-ts/lib/IO'
import { createServer, httpListener } from '@marblejs/http'
import { logger$ } from '@marblejs/middleware-logger'
import { bodyParser$ } from '@marblejs/middleware-body'

import { createConfig } from '@/app/config'
import { createDataSource } from '@/app/data/data-source'
import { createRedisClient } from '@/app/data/redis'
import { root$ } from '@/app/routes'

const config = createConfig()

const dataSource = createDataSource(config)

const redisClient = createRedisClient(config)

const middlewares = [
    logger$(),
    bodyParser$(),
]

const effects = [
    root$,
]

export const listener = httpListener({
    middlewares,
    effects,
})

const server = createServer({
    port: config.port,
    listener,
})

const main: IO<void> = async () => {
    await redisClient.connect()
    await dataSource.initialize()
    await (await server)()
}

main()
