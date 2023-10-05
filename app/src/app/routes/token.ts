import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/lib/function'
import * as t from 'io-ts'
import { DataSource } from 'typeorm'

import { RedisClient } from '@/app/data/redis'
import { getUserCode, removeUserCode } from '@/app/misc/user-code'
import { ErrorMessage } from '@/app/messages'
import { createUser, getUser } from '@/app/misc/user'
import { isEmail } from '@/app/utils/is-email'
import { AppConfig } from '@/app/config'
import { createJwtToken, saveSession } from '@/app/misc/token'

type CreateTokenResponse = {
    token: string,
}

type CreateToken = (c: AppConfig) => (d: DataSource) => (r: RedisClient) => (req: unknown) => (
    TE.TaskEither<Error, CreateTokenResponse>
)

const createTokenSchema = t.type({
    body: t.type({
        email: t.string,
        code: t.string,
    }),
})

export const createToken: CreateToken = config => data => redis => req => pipe(
    createTokenSchema.decode(req),
    E.mapLeft(() => new Error(ErrorMessage.WRONG_DATA)),
    E.filterOrElse(
        ({ body }) => isEmail(body.email),
        () => new Error(ErrorMessage.WRONG_EMAIL),
    ),
    TE.fromEither,
    TE.map(({ body }) => ({
        code: body.code.toLowerCase(),
        email: body.email.toLowerCase(),
    })),
    TE.bindTo('body'),
    TE.bind('code', d => getUserCode(redis)(d.body.email)),
    TE.filterOrElse(
        d => !!d.code && d.code.value === d.body.code,
        () => new Error(ErrorMessage.WRONG_CODE),
    ),
    TE.tap(d => removeUserCode(redis)(d.body.email)),
    TE.bind('user', d => getUser(data)(d.body.email)),
    TE.chain(d => (d.user ? TE.right(d.user) : createUser(data)(d.body.email))),
    TE.bindTo('user'),
    TE.bind('session', d => saveSession(redis)(d.user)),
    TE.map(d => createJwtToken(config.jwtSecret)(d.user)(d.session)),
    TE.map(token => ({ token })),
)
