import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import * as t from 'io-ts'
import { pipe } from 'fp-ts/lib/function'

import { RedisClient } from '@/app/data/redis'
import { ErrorMessage } from '@/app/messages'
import { AppConfig } from '@/app/config'
import { makeUserCode, getUserCode, saveUserCode } from '@/app/misc/user-code'
import { SmtpTransporter, sendUserCode } from '@/app/misc/mailer'

const createCodeSchema = t.type({
    body: t.type({
        email: t.string,
    }),
})

type CreateCodeResponse = {
    success: true
}

type CreateCode = (t: SmtpTransporter) => (c: AppConfig) => (r: RedisClient) => (req: unknown) => (
    TE.TaskEither<Error, CreateCodeResponse>
)

export const createCode: CreateCode = transporter => config => redis => req => pipe(
    createCodeSchema.decode(req),
    E.mapLeft(() => new Error(ErrorMessage.WRONG_DATA)),
    E.map(r => r.body.email),
    TE.fromEither,
    TE.bindTo('email'),
    TE.bind('code', d => getUserCode(redis)(d.email)),
    TE.filterOrElse(
        d => (d.code ? Date.now() - d.code.createdAt > config.sendCodeTimeout : true),
        () => new Error(ErrorMessage.CODE_TIMEOUT),
    ),
    TE.bind('codeNew', () => TE.right(makeUserCode())),
    TE.tap(d => saveUserCode(redis)(d.email)(d.codeNew)),
    TE.tap(d => sendUserCode(transporter)(d.email)(d.codeNew.value)),
    TE.map(() => ({ success: true })),
)
