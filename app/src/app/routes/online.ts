import * as O from 'fp-ts/Option'
import * as TE from 'fp-ts/TaskEither'
import { DataSource } from 'typeorm'
import { pipe } from 'fp-ts/lib/function'

import { getOnline } from '@/app/misc/timer'

type OnlineResponse = {
    online: number,
}

type OnlineRoute = (d: DataSource) => (req: unknown) => (
    TE.TaskEither<Error, OnlineResponse>
)

let online = 1
let updated = 0

export const onlineRoute: OnlineRoute = data => () => pipe(
    Date.now() - updated < 60000 ? online : null,
    O.fromNullable,
    O.fold(
        () => pipe(
            getOnline(data),
            TE.tap(value => {
                online = value || 1
                updated = Date.now()
                return TE.right(value)
            }),
        ),
        () => TE.right(online),
    ),
    TE.map(val => ({ online: val })),
)
