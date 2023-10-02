import jwt from 'jsonwebtoken'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/lib/function'

import { User } from '@/app/entities/User'
import { RedisClient } from '@/app/data/redis'
import { ErrorMessage } from '@/app/messages'

type CreateToken = (secret: string) => (u: User) => (date: number) => string

export const createJwtToken: CreateToken = secret => user => date => (
    jwt.sign({ date, id: user.id }, secret)
)

const createSessionKey = (userId: number) => `session.${userId}`

type GetSession = (r: RedisClient) => (userId: number) => TE.TaskEither<Error, number | null>

export const getSession: GetSession = redis => userId => pipe(
    TE.of(createSessionKey(userId)),
    TE.flatMap(key => TE.tryCatch(() => redis.get(key), E.toError)),
    TE.map(a => (a ? parseInt(a, 10) : null)),
)

type CreateSession = (r: RedisClient) => (user: User) => TE.TaskEither<Error, number>

export const saveSession: CreateSession = redis => user => pipe(
    TE.of(Date.now()),
    TE.bindTo('date'),
    TE.tap(d => TE.tryCatch(() => redis.set(createSessionKey(user.id), d.date), E.toError)),
    TE.map(d => d.date),
)

type TokenData = {
    id: number,
    date: number,
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
        a => !!a.session && a.token.date >= a.session,
        () => new Error(ErrorMessage.WRONG_TOKEN),
    ),
    TE.map(d => d.token),
)
