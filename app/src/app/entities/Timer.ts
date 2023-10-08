import {
    Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm'

import { User } from '@/app/entities/User'

@Entity()
export class Timer {
    @PrimaryGeneratedColumn()
        id: number

    @Column({
        type: 'timestamptz',
    })
        createdAt: Date

    @Column({
        type: 'timestamptz',
        nullable: true,
    })
        stoppedAt?: Date

    @Column({
        type: 'int',
    })
        minutes: number

    @ManyToOne(() => User, user => user.timers)
    @JoinColumn()
        user: User
}
