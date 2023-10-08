import { pipe } from 'fp-ts/lib/function'
import * as TE from 'fp-ts/TaskEither'
import * as t from 'io-ts'
import { DataSource } from 'typeorm'

import { ErrorMessage } from '@/app/messages'
import { verifyToken } from '@/app/misc/token'
import { RedisClient } from '@/app/data/redis'
import { AppConfig } from '@/app/config'
import { createTimer, getTimers, stopTimer } from '@/app/misc/timer'
import { Timer } from '@/app/entities/Timer'
import { decodeReq } from '@/app/routes/utils'

const createTimerSchema = t.type({
    body: t.type({
        minutes: t.number,
    }),
    headers: t.type({
        token: t.string,
    }),
})

type TimerResponse = {
    id: number,
    createdAt: Date,
    stoppedAt?: Date,
    minutes: number,
}

const timerToResponse = (timer: Timer): TimerResponse => ({
    createdAt: timer.createdAt,
    id: timer.id,
    minutes: timer.minutes,
    stoppedAt: timer.stoppedAt,
})

type CreateTimerRoute = (d: DataSource) => (r: RedisClient) => (c: AppConfig) => (req: unknown) => (
    TE.TaskEither<Error, TimerResponse>
)

export const createTimerRoute: CreateTimerRoute = data => redis => config => req => pipe(
    decodeReq(createTimerSchema)(req),
    TE.filterOrElse(({ body }) => body.minutes >= 1, () => new Error(ErrorMessage.WRONG_DATA)),
    TE.chain(({ headers, body }) => pipe(
        verifyToken(redis)(config.jwtSecret)(headers.token),
        TE.chain(token => createTimer(data)(token.id)(body)),
        TE.map(timerToResponse),
    )),
)

const stopTimerSchema = t.type({
    body: t.type({
        id: t.number,
    }),
    headers: t.type({
        token: t.string,
    }),
})

type StopTimerRoute = (d: DataSource) => (r: RedisClient) => (c: AppConfig) => (req: unknown) => (
    TE.TaskEither<Error, { success: boolean }>
)

export const stopTimerRoute: StopTimerRoute = data => redis => config => req => pipe(
    decodeReq(stopTimerSchema)(req),
    TE.chain(({ headers, body }) => pipe(
        verifyToken(redis)(config.jwtSecret)(headers.token),
        TE.chain(token => stopTimer(data)(token.id)(body.id)),
        TE.map(() => ({ success: true })),
    )),
)

const timersSchema = t.type({
    headers: t.type({
        token: t.string,
    }),
})

type TimersRoute = (d: DataSource) => (r: RedisClient) => (c: AppConfig) => (req: unknown) => (
    TE.TaskEither<Error, TimerResponse[]>
)

export const timersRoute: TimersRoute = data => redis => conf => req => pipe(
    decodeReq(timersSchema)(req),
    TE.chain(({ headers }) => pipe(
        verifyToken(redis)(conf.jwtSecret)(headers.token),
        TE.chain(token => getTimers(data)(token.id)),
        TE.map(timers => timers.map(timerToResponse)),
    )),
)
