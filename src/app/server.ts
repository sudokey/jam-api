import { IO } from 'fp-ts/lib/IO'
import { createServer, httpListener, r } from '@marblejs/http'
import { mapTo } from 'rxjs/operators'
import { logger$ } from '@marblejs/middleware-logger'
import { bodyParser$ } from '@marblejs/middleware-body'

const api$ = r.pipe(
    r.matchPath('/'),
    r.matchType('GET'),
    r.useEffect(req$ => req$.pipe(
        mapTo({ body: 'Jam!' }),
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
    await (await server)()
}

main()
