import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

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
}
