import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/lib/function'
import { DataSource, UpdateResult } from 'typeorm'

import { Timer } from '@/app/entities/Timer'
import { User } from '@/app/entities/User'

type TimerData = {
    minutes: number,
}

type SaveTimer = (d: DataSource) => (t: Timer) => TE.TaskEither<Error, Timer>

export const saveTimer: SaveTimer = data => timer => pipe(
    TE.tryCatch(() => data.manager.save(Timer, timer), E.toError),
)

type CreateTimer = (d: DataSource) => (userId: number) => (data: TimerData) => (
    TE.TaskEither<Error, Timer>
)

export const createTimer: CreateTimer = data => userId => timerData => pipe(
    TE.of((() => {
        const timer = new Timer()
        timer.createdAt = new Date()
        timer.minutes = timerData.minutes
        timer.user = new User()
        timer.user.id = userId
        return timer
    })()),
    TE.chain(saveTimer(data)),
)

type StopTimer = (d: DataSource) => (userId: number) => (timerId: number) => (
    TE.TaskEither<Error, UpdateResult>
)

export const stopTimer: StopTimer = data => userId => timerId => pipe(
    TE.tryCatch(
        () => data.manager.update(
            Timer,
            { user: { id: userId }, id: timerId },
            { stoppedAt: new Date() },
        ),
        E.toError,
    ),
)

type GetTimer = (d: DataSource) => (userId: number) => TE.TaskEither<Error, Timer[]>

export const getTimers: GetTimer = data => userId => pipe(
    TE.tryCatch(() => data.manager.findBy(Timer, { user: { id: userId } }), E.toError),
)
