import 'dotenv-flow/config'

export type PostgresConfig = {
    postgresUser: string,
    postgresPassword: string,
    postgresPort: number,
    postgresHost: string,
    postgresDb: string,
}

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

export const config: PostgresConfig = {
    postgresUser: process.env.POSTGRES_USER,
    postgresPassword: process.env.POSTGRES_PASSWORD,
    postgresPort: parseInt(process.env.POSTGRES_PORT, 10),
    postgresHost: process.env.POSTGRES_HOST,
    postgresDb: process.env.POSTGRES_DB,
}
