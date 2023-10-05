import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import { DataSource, UpdateResult } from 'typeorm'
import { pipe } from 'fp-ts/lib/function'

import { User } from '@/app/entities/User'
import { makeId } from '@/app/utils/make-id'
import { ErrorMessage } from '@/app/messages'

type GetUser = (d: DataSource) => (email: string) => TE.TaskEither<Error, User | null>

export const getUser: GetUser = data => email => pipe(
    TE.tryCatch(
        () => data.manager.findOne(User, { where: { email } }),
        E.toError,
    ),
)

type GetUserById = (d: DataSource) => (id: number) => TE.TaskEither<Error, User | null>

export const getUserById: GetUserById = data => id => pipe(
    TE.tryCatch(
        () => data.manager.findOne(User, { where: { id } }),
        E.toError,
    ),
)

type SaveUser = (d: DataSource) => (u: User) => TE.TaskEither<Error, User>

export const saveUser: SaveUser = data => user => pipe(
    TE.tryCatch(() => data.manager.save(User, user), E.toError),
)

type CreateUser = (d: DataSource) => (email: string) => TE.TaskEither<Error, User>

export const createUser: CreateUser = data => email => pipe(
    TE.of(makeId(10).toLowerCase()),
    TE.map(nickname => {
        const user = new User()
        user.email = email.toLowerCase()
        user.nickname = nickname.toLowerCase()
        return user
    }),
    TE.chain(saveUser(data)),
)

type UserData = {
    firstName: string,
    lastName: string,
    location: string,
    about: string,
    nickname: string,
}

type UpdateUser = (d: DataSource) => (id: number) => (userData: UserData) => (
    TE.TaskEither<Error, UpdateResult>
)

export const updateUser: UpdateUser = data => id => userData => pipe(
    TE.of(userData),
    TE.filterOrElse(
        d => (
            d.firstName.length <= 24
            && d.lastName.length <= 24
            && d.nickname.length <= 24
            && d.location.length <= 36
            && d.about.length <= 255
        ),
        () => new Error(ErrorMessage.WRONG_DATA),
    ),
    TE.chain(() => TE.tryCatch(() => data.manager.update(User, { id }, userData), E.toError)),
)
