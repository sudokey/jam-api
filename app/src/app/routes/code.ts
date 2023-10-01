/* eslint-disable max-len */
import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import * as t from 'io-ts'
import { flow, pipe } from 'fp-ts/lib/function'

import { RedisClient } from '@/app/data/redis'
import { ErrorMessage } from '@/app/messages'
import { isEmail } from '@/app/utils/is-email'
import { AppConfig } from '@/app/config'
import { makeUserCode, getUserCode, saveUserCode } from '@/app/misc/user-code'
import { SmtpTransporter, sendCode } from '@/app/misc/mailer'

const createCodeRequestSchema = t.type({
    body: t.type({
        email: t.string,
    }),
})

type DecodeCreateCodeRequest = (req: unknown) => E.Either<Error, string>

const decodeCreateCodeRequest: DecodeCreateCodeRequest = flow(
    createCodeRequestSchema.decode,
    E.mapLeft(() => new Error(ErrorMessage.WRONG_DATA)),
    E.map(r => r.body.email.toLowerCase()),
    E.filterOrElse(isEmail, () => new Error(ErrorMessage.WRONG_EMAIL)),
)

type CreateCodeResponse = {
    success: true
}

type CreateCode = (t: SmtpTransporter, c: AppConfig, r: RedisClient) => (req: unknown) => (
    TE.TaskEither<Error, CreateCodeResponse>
)

export const createCode: CreateCode = (transporter, config, redis) => req => pipe(
    TE.fromEither(decodeCreateCodeRequest(req)),
    TE.flatMap(email => pipe(
        getUserCode(redis)(email),
        TE.filterOrElse(
            code => (code ? Date.now() - code.createdAt > config.sendCodeTimeout : true),
            () => new Error(ErrorMessage.CODE_TIMEOUT),
        ),
        TE.map(makeUserCode),
        TE.flatMap(saveUserCode(redis)(email)),
        TE.map(code => code.value.toUpperCase()),
        TE.flatMap(sendCode(transporter)(email)),
        TE.map(() => ({ success: true })),
    )),
)
