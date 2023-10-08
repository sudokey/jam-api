import { pipe } from 'fp-ts/lib/function'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import * as t from 'io-ts'

import { ErrorMessage } from '@/app/messages'

export const decodeReq = <T extends t.Props>(schema: t.TypeC<T>) => (req: unknown) => pipe(
    schema.decode(req),
    E.mapLeft(() => new Error(ErrorMessage.WRONG_DATA)),
    TE.fromEither,
)
