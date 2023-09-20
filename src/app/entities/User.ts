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
}
