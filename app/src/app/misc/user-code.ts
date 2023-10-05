/* eslint-disable max-len */
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/lib/function'
import { toLowerCase } from 'fp-ts/lib/string'

import { RedisClient } from '@/app/data/redis'
import { makeId } from '@/app/utils/make-id'
import { isEmail } from '@/app/utils/is-email'
import { ErrorMessage } from '@/app/messages'
import { maxLength } from '@/app/utils/fp'

export type UserCode = {
    value: string,
    createdAt: number,
}

const CODE_LENGTH = 8

export const makeUserCode = (): UserCode => ({
    value: makeId(CODE_LENGTH).toLowerCase(),
    createdAt: Date.now(),
})

export const serializeUserCode = (code: UserCode): string => `${code.value}.${code.createdAt}`.toLowerCase()

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

type GetUserCodeKey = (email: string) => E.Either<Error, string>

export const getUserCodeKey: GetUserCodeKey = email => pipe(
    E.of(email),
    E.map(toLowerCase),
    E.filterOrElse(isEmail, () => new Error(ErrorMessage.WRONG_EMAIL)),
    E.filterOrElse(maxLength(70), () => new Error(ErrorMessage.WRONG_EMAIL)),
    E.map(e => `code.${e}`),
)

type GetUserCode = (r: RedisClient) => (email: string) => TE.TaskEither<Error, UserCode | null>

export const getUserCode: GetUserCode = redis => email => pipe(
    TE.fromEither(getUserCodeKey(email)),
    TE.chain(key => TE.tryCatch(() => redis.get(key), E.toError)),
    TE.map(code => (code ? parseUserCode(code) : E.right(null))),
    TE.chain(TE.fromEither),
)

type SaveUserCode = (r: RedisClient) => (email: string) => (code: UserCode) => TE.TaskEither<Error, UserCode>

export const saveUserCode: SaveUserCode = redis => email => code => pipe(
    TE.fromEither(getUserCodeKey(email)),
    TE.chain(key => TE.tryCatch(() => redis.set(key, serializeUserCode(code)), E.toError)),
    TE.map(() => code),
)

type RemoveCode = (r: RedisClient) => (email: string) => TE.TaskEither<Error, string>

export const removeUserCode: RemoveCode = redis => email => pipe(
    TE.fromEither(getUserCodeKey(email)),
    TE.chain(key => pipe(TE.tryCatch(() => redis.del(key), E.toError))),
    TE.map(() => email),
)
