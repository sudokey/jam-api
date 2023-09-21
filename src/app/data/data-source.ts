import { DataSource } from 'typeorm'

import { PostgresConfig } from '@/app/config'
import { User } from '@/app/entities/User'

export const createDataSource = (config: PostgresConfig) => (
    new DataSource({
        type: 'postgres',
        host: config.postgresHost,
        port: config.postgresPort,
        username: config.postgresUser,
        password: config.postgresPassword,
        database: config.postgresDb,
        entities: [User],
        synchronize: true,
        logging: false,
    })
)
