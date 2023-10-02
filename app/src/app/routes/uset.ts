import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import * as t from 'io-ts'
import { pipe } from 'fp-ts/lib/function'
import { DataSource } from 'typeorm'

import { User } from '@/app/entities/User'
import { verifyToken } from '@/app/misc/token'
import { AppConfig } from '@/app/config'
import { getUserById } from '@/app/misc/user'
import { ErrorMessage } from '@/app/messages'
import { RedisClient } from '@/app/data/redis'

type GetUserResponse = {
    user: User | null,
}

const getUserSchema = t.type({
    body: t.type({
        token: t.string,
    }),
})

type GetUser = (r: RedisClient) => (d: DataSource) => (c: AppConfig) => (req: unknown) => (
    TE.TaskEither<Error, GetUserResponse>
)

export const getUser: GetUser = redis => data => config => req => pipe(
    getUserSchema.decode(req),
    E.mapLeft(() => new Error(ErrorMessage.WRONG_DATA)),
    TE.fromEither,
    TE.map(r => r.body.token),
    TE.flatMap(verifyToken(redis)(config.jwtSecret)),
    TE.flatMap(token => getUserById(data)(token.id)),
    TE.map(user => ({ user })),
)
