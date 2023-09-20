import 'module-alias/register'

import { IO } from 'fp-ts/lib/IO'
import { createServer, httpListener, r } from '@marblejs/http'
import { map } from 'rxjs/operators'
import { logger$ } from '@marblejs/middleware-logger'
import { bodyParser$ } from '@marblejs/middleware-body'

import { createDataSource } from '@/app/data'
import { config } from '@/app/config'

const dataSource = createDataSource(config)

const api$ = r.pipe(
    r.matchPath('/'),
    r.matchType('GET'),
    r.useEffect(req$ => req$.pipe(
        map(() => ({ body: 'Jam!' })),
    )),
)

const middlewares = [
    logger$(),
    bodyParser$(),
]

const effects = [
    api$,
]

export const listener = httpListener({
    middlewares,
    effects,
})

const server = createServer({
    port: 2222,
    listener,
})

const main: IO<void> = async () => {
    await dataSource.initialize()
    await (await server)()
}

main()
