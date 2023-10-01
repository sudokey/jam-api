import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import { DataSource } from 'typeorm'
import { pipe } from 'fp-ts/lib/function'

import { User } from '@/app/entities/User'
import { makeId } from '@/app/utils/make-id'

type GetUser = (d: DataSource) => (email: string) => TE.TaskEither<Error, User | null>

export const getUser: GetUser = data => email => pipe(
    TE.tryCatch(
        () => data.manager.findOne(User, { where: { email } }),
        E.toError,
    ),
)

type CreateUser = (d: DataSource) => (email: string) => TE.TaskEither<Error, User>

export const createUser: CreateUser = data => email => pipe(
    TE.of(makeId(10).toLowerCase()),
    TE.map(nickname => {
        const user = new User()
        user.email = email
        user.nickname = nickname
        return user
    }),
    TE.flatMap(user => pipe(
        TE.tryCatch(() => data.manager.save(User, user), E.toError),
    )),
)
