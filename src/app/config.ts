import 'dotenv-flow/config'

export type ServerConfig = {
    port: number,
}

export type PostgresConfig = {
    postgresUser: string,
    postgresPassword: string,
    postgresPort: number,
    postgresHost: string,
    postgresDb: string,
}

export type RedisConfig = {
    redisPassword: string,
    redisHost: string,
    redisPort: number,
}

type Config = ServerConfig & PostgresConfig & RedisConfig

export const createConfig = (): Config => {
    if (!process.env.POSTGRES_USER) {
        throw new Error('POSTGRES_USER must be defined')
    }

    if (!process.env.POSTGRES_PASSWORD) {
        throw new Error('POSTGRES_PASSWORD must be defined')
    }

    if (!process.env.POSTGRES_PORT) {
        throw new Error('POSTGRES_PORT must be defined')
    }

    if (!process.env.POSTGRES_HOST) {
        throw new Error('POSTGRES_HOST must be defined')
    }

    if (!process.env.POSTGRES_DB) {
        throw new Error('POSTGRES_DB must be defined')
    }

    if (!process.env.PORT) {
        throw new Error('PORT must be defined')
    }

    if (!process.env.REDIS_PASSWORD) {
        throw new Error('REDIS_PASSWORD must be defined')
    }

    if (!process.env.REDIS_HOST) {
        throw new Error('REDIS_HOST must be defined')
    }

    if (!process.env.REDIS_PORT) {
        throw new Error('REDIS_PORT must be defined')
    }

    return {
        port: parseInt(process.env.PORT, 10),
        postgresUser: process.env.POSTGRES_USER,
        postgresPassword: process.env.POSTGRES_PASSWORD,
        postgresPort: parseInt(process.env.POSTGRES_PORT, 10),
        postgresHost: process.env.POSTGRES_HOST,
        postgresDb: process.env.POSTGRES_DB,
        redisPassword: process.env.REDIS_PASSWORD,
        redisHost: process.env.REDIS_HOST,
        redisPort: parseInt(process.env.REDIS_PORT, 10),
    }
}
