import {
    Column, Entity, OneToMany, PrimaryGeneratedColumn,
} from 'typeorm'

import { Timer } from '@/app/entities/Timer'

@Entity()
export class User {
    @PrimaryGeneratedColumn()
        id: number

    @Column({
        type: 'citext',
        unique: true,
    })
        email: string

    @Column({
        type: 'citext',
        unique: true,
    })
        nickname: string

    @Column({
        type: 'text',
        nullable: true,
    })
        firstName?: string

    @Column({
        type: 'text',
        nullable: true,
    })
        lastName?: string

    @Column({
        type: 'text',
        nullable: true,
    })
        location?: string

    @Column({
        type: 'text',
        nullable: true,
    })
        about?: string

    @OneToMany(() => Timer, timer => timer.user)
        timers?: Timer[]
}
