import * as t from 'io-ts'
import * as TE from 'fp-ts/TaskEither'
import { pipe } from 'fp-ts/lib/function'
import { DataSource } from 'typeorm'

import { decodeReq } from '@/app/routes/utils'
import { getCurrentStreak, getMinutes } from '@/app/misc/timer'
import { RedisClient } from '@/app/data/redis'
import { AppConfig } from '@/app/config'
import { verifyToken } from '@/app/misc/token'

type StatsResponse = {
    currentStreak: number,
    bestStreak: number,
    minutes: number,
}

type StatsRoute = (d: DataSource) => (r: RedisClient) => (c: AppConfig) => (req: unknown) => (
    TE.TaskEither<Error, StatsResponse>
)

const statsSchema = t.type({
    headers: t.type({
        token: t.string,
    }),
    params: t.type({
        id: t.string,
    }),
})

export const statsRoute: StatsRoute = data => redis => conf => req => pipe(
    decodeReq(statsSchema)(req),
    TE.tap(({ headers }) => verifyToken(redis)(conf.jwtSecret)(headers.token)),
    TE.map(({ params }) => parseInt(params.id, 10)),
    TE.chain(userId => pipe(
        getMinutes(data)(userId),
        TE.bindTo('minutes'),
        TE.bind('currentStreak', () => getCurrentStreak(data)(userId)),
        TE.map(result => ({
            ...result,
            bestStreak: 0,
        })),
    )),
)
