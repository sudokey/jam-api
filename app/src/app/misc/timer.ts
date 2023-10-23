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
    TE.tryCatch(
        () => data.manager.find(Timer, {
            order: {
                id: {
                    direction: 'desc',
                },
            },
            where: {
                user: {
                    id: userId,
                },
            },
        }),
        E.toError,
    ),
)

type GetOnline = (d: DataSource) => TE.TaskEither<Error, number>

export const getOnline: GetOnline = data => pipe(
    TE.tryCatch(
        () => data.getRepository(Timer)
            .createQueryBuilder('timer')
            .where("CURRENT_TIMESTAMP - timer.createdAt < timer.minutes * '1 m'::interval")
            .getCount(),
        E.toError,
    ),
)

type GetMinutes = (d: DataSource) => (userId: number) => TE.TaskEither<Error, number>

export const getMinutes: GetMinutes = data => userId => pipe(
    getTimers(data)(userId),
    TE.map(timers => timers.reduce((acc, item) => acc + item.minutes, 0)),
)

export const calcCurrentStreak = (timers: Timer[]): number => {
    const result = new Set()
    let today = new Date().setUTCHours(0, 0, 0, 0)
    let yesterday = today - 86400000

    for (let i = 0; i < timers.length; i++) {
        const test = timers[i].createdAt.setUTCHours(0, 0, 0, 0)
        if (test === today) {
            result.add(test)
        } else if (test === yesterday) {
            result.add(test)
            today = yesterday
            yesterday -= 86400000
        } else {
            break
        }
    }

    return result.size
}

type GetCurrentStreak = (d: DataSource) => (userId: number) => TE.TaskEither<Error, number>

export const getCurrentStreak: GetCurrentStreak = data => userId => pipe(
    getTimers(data)(userId),
    TE.map(calcCurrentStreak),
)
