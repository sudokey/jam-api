/* eslint-disable max-len */
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/lib/function'

import { RedisClient } from '@/app/data/redis'
import { makeId } from '@/app/utils/make-id'

export type UserCode = {
    value: string,
    createdAt: number,
}

const CODE_LENGTH = 8

export const makeUserCode = (): UserCode => ({
    value: makeId(CODE_LENGTH).toLowerCase(),
    createdAt: Date.now(),
})

export const serializeUserCode = (code: UserCode): string => `${code.value}.${code.createdAt}`

type ParseUserCode = (str: string) => E.Either<Error, UserCode>

export const parseUserCode: ParseUserCode = str => pipe(
    E.of(str.split('.')),
    E.filterOrElse(([value]) => !!value, () => new Error('User code value not defined')),
    E.filterOrElse(([, createdAt]) => !!createdAt, () => new Error('User code createdAt not defined')),
    E.map(([value, createdAt]) => [value, parseInt(createdAt, 10)] as const),
    E.filterOrElse(([, createdAt]) => !!createdAt, () => new Error('User code createdAt not valid')),
    E.filterOrElse(([value]) => value.length === CODE_LENGTH, () => new Error('User code value not valid')),
    E.map(([value, createdAt]) => ({ value, createdAt })),
)

export const getUserCodeKey = (email: string): string => `code.${email}`.toLowerCase()

type GetUserCode = (redis: RedisClient) => (email: string) => TE.TaskEither<Error, UserCode | null>

export const getUserCode: GetUserCode = redis => email => pipe(
    TE.tryCatch(() => redis.get(getUserCodeKey(email)), E.toError),
    TE.map(code => (code ? parseUserCode(code) : E.right(null))),
    TE.flatMap(TE.fromEither),
)

type SaveUserCode = (r: RedisClient) => (email: string) => (code: UserCode) => TE.TaskEither<Error, UserCode>

export const saveUserCode: SaveUserCode = redis => email => code => pipe(
    TE.tryCatch(() => redis.set(getUserCodeKey(email), serializeUserCode(code)), E.toError),
    TE.map(() => code),
)
