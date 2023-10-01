import jwt from 'jsonwebtoken'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/lib/function'

import { User } from '@/app/entities/User'
import { RedisClient } from '@/app/data/redis'

type CreateToken = (secret: string) => (u: User) => string

export const createJwtToken: CreateToken = secret => user => (
    jwt.sign({
        id: user.id,
        email: user.email,
        nickname: user.nickname,
    }, secret)
)

const createSessionKey = (id: number) => `session.${id}`

type SaveTokenDate = (r: RedisClient) => (id: number) => TE.TaskEither<Error, number>

export const saveTokenSession: SaveTokenDate = redis => id => pipe(
    TE.of(Date.now()),
    TE.flatMap(date => pipe(
        TE.tryCatch(() => redis.set(createSessionKey(id), date), E.toError),
        TE.map(() => date),
    )),
)
