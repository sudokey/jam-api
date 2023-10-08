import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import { DataSource } from 'typeorm'
import { pipe } from 'fp-ts/lib/function'

import { RedisClient } from '@/app/data/redis'
import { getOnline } from '@/app/misc/timer'

type OnlineResponse = {
    online: number,
}

type OnlineRoute = (d: DataSource) => (r: RedisClient) => (req: unknown) => (
    TE.TaskEither<Error, OnlineResponse>
)

export const onlineRoute: OnlineRoute = data => redis => () => pipe(
    TE.tryCatch(() => redis.get('online.updated'), E.toError),
    TE.map(value => value ? parseInt(value, 10) : null),
    TE.chain(updated => updated && Date.now() - updated < 60000
        ? pipe(
            TE.tryCatch(() => redis.get('online.value'), E.toError),
            TE.map(value => value ? parseInt(value, 10) : null),
        )
        : TE.right(null)),
    TE.chain(online => online != null
        ? TE.right(online)
        : pipe(
            getOnline(data),
            TE.tap(value => TE.tryCatch(() => redis.set('online.value', value), E.toError)),
            TE.tap(() => TE.tryCatch(() => redis.set('online.updated', Date.now()), E.toError)),
        )),
    TE.map(online => ({ online })),
)
