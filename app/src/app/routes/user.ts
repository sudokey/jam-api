import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import * as t from 'io-ts'
import { pipe } from 'fp-ts/lib/function'
import { DataSource } from 'typeorm'

import { User } from '@/app/entities/User'
import { verifyToken } from '@/app/misc/token'
import { AppConfig } from '@/app/config'
import { getUserById, updateUser } from '@/app/misc/user'
import { ErrorMessage } from '@/app/messages'
import { RedisClient } from '@/app/data/redis'

type GetUserResponse = {
    user: User | null,
}

const getUserSchema = t.type({
    headers: t.type({
        token: t.string,
    }),
})

type GetUser = (r: RedisClient) => (d: DataSource) => (c: AppConfig) => (req: unknown) => (
    TE.TaskEither<Error, GetUserResponse>
)

export const getUserRoute: GetUser = redis => data => config => req => pipe(
    getUserSchema.decode(req),
    E.mapLeft(() => new Error(ErrorMessage.WRONG_DATA)),
    TE.fromEither,
    TE.map(r => r.headers.token),
    TE.chain(verifyToken(redis)(config.jwtSecret)),
    TE.chain(token => getUserById(data)(token.id)),
    TE.map(user => ({ user })),
)

const updateUsrSchema = t.type({
    body: t.type({
        firstName: t.string,
        lastName: t.string,
        location: t.string,
        about: t.string,
        nickname: t.string,
    }),
    headers: t.type({
        token: t.string,
    }),
})

type UpdateUserResponse = {
    success: boolean,
}

type UpdateUser = (r: RedisClient) => (d: DataSource) => (c: AppConfig) => (req: unknown) => (
    TE.TaskEither<Error, UpdateUserResponse>
)

export const updateUserRoute: UpdateUser = redis => data => config => req => pipe(
    updateUsrSchema.decode(req),
    E.mapLeft(() => new Error(ErrorMessage.WRONG_DATA)),
    TE.fromEither,
    TE.bindTo('req'),
    TE.bind('token', d => verifyToken(redis)(config.jwtSecret)(d.req.headers.token)),
    TE.tap(d => updateUser(data)(d.token.id)(d.req.body)),
    TE.map(() => ({ success: true })),
)
