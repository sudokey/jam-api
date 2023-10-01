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
import { createJwtToken, saveTokenSession } from '@/app/misc/token'

type CreateTokenResponse = {
    token: string,
}

type CreateToken = (c: AppConfig, d: DataSource, r: RedisClient) => (req: unknown) => (
    TE.TaskEither<Error, CreateTokenResponse>
)

const createTokenRequestSchema = t.type({
    body: t.type({
        email: t.string,
        code: t.string,
    }),
})

export const createToken: CreateToken = (config, data, redis) => req => pipe(
    createTokenRequestSchema.decode(req),
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
    TE.flatMap(body => pipe(
        getUserCode(redis)(body.email),
        TE.filterOrElse(
            code => !!code && code.value === body.code,
            () => new Error(ErrorMessage.WRONG_CODE),
        ),
        TE.flatMap(() => removeUserCode(redis)(body.email)),
        TE.flatMap(() => getUser(data)(body.email)),
        TE.flatMap(user => (user ? TE.right(user) : createUser(data)(body.email))),
    )),
    TE.flatMap(user => pipe(
        saveTokenSession(redis)(user.id),
        TE.map(() => createJwtToken(config.jwtSecret)(user)),
    )),
    TE.map(token => ({ token })),
)
