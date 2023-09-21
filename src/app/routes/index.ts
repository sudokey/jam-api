import { combineRoutes } from '@marblejs/http'

import { createCode$ } from '@/app/routes/code'

const api$ = combineRoutes('/api/v1/', [
    createCode$,
])

export const root$ = combineRoutes('/', [
    api$,
])
