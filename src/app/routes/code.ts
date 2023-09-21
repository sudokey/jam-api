import { r } from '@marblejs/http'

export const createCode$ = r.pipe(
    r.matchPath('/code'),
    r.matchType('POST'),
    r.useEffect(req$ => req$.pipe()),
)
