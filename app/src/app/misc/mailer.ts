/* eslint-disable max-len */
import nodemailer from 'nodemailer'
import { pipe } from 'fp-ts/lib/function'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import SMTPTransport from 'nodemailer/lib/smtp-transport'

import { SmtpConfig } from '@/app/config'

export type SmtpTransporter = nodemailer.Transporter<SMTPTransport.SentMessageInfo>

export const createSmtpTransporter = (config: SmtpConfig): SmtpTransporter => (
    nodemailer.createTransport({
        host: 'smtp.yandex.ru',
        port: 465,
        secure: true,
        auth: {
            user: config.smtpUser,
            pass: config.smtpPassword,
        },
    })
)

type SendCode = (t: SmtpTransporter) => (email: string) => (code: string) => TE.TaskEither<Error, void>

export const sendCode: SendCode = transporter => email => code => pipe(
    TE.tryCatch(() => transporter.sendMail({
        from: 'sudokey@yandex.ru',
        to: email,
        subject: 'One-time password for Jam',
        text: code,
    }), E.toError),
    TE.map(() => undefined),
)
