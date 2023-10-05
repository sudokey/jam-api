import jwt from 'jsonwebtoken'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/lib/function'

import { User } from '@/app/entities/User'
import { RedisClient } from '@/app/data/redis'
import { ErrorMessage } from '@/app/messages'
import { makeId } from '@/app/utils/make-id'

type CreateToken = (secret: string) => (u: User) => (session: string) => string

export const createJwtToken: CreateToken = secret => user => session => (
    jwt.sign({ session, id: user.id }, secret)
)

const createSessionKey = (userId: number) => `session.${userId}`

type GetSession = (r: RedisClient) => (userId: number) => TE.TaskEither<Error, string | null>

export const getSession: GetSession = redis => userId => pipe(
    TE.of(createSessionKey(userId)),
    TE.chain(key => TE.tryCatch(() => redis.get(key), E.toError)),
)

type CreateSession = (r: RedisClient) => (user: User) => TE.TaskEither<Error, string>

export const saveSession: CreateSession = redis => user => pipe(
    TE.of(makeId(8)),
    TE.tap(session => TE.tryCatch(() => redis.set(createSessionKey(user.id), session), E.toError)),
)

type TokenData = {
    id: number,
    session: string,
}

type VerifyToken = (r: RedisClient) => (secret: string) => (token: string) => (
    TE.TaskEither<Error, TokenData>
)

export const verifyToken: VerifyToken = redis => secret => token => pipe(
    TE.tryCatch(() => new Promise<TokenData>((resolve, reject) => {
        jwt.verify(token, secret, (err, data) => {
            if (!err) resolve(data as TokenData)
            else reject(new Error(ErrorMessage.WRONG_TOKEN))
        })
    }), E.toError),
    TE.bindTo('token'),
    TE.bind('session', d => getSession(redis)(d.token.id)),
    TE.filterOrElse(
        d => !!d.session && d.token.session === d.session,
        () => new Error(ErrorMessage.WRONG_TOKEN),
    ),
    TE.map(d => d.token),
)
