import * as TE from 'fp-ts/TaskEither'
import { pipe } from 'fp-ts/lib/function'

type CreateTokenResponse = {
    token: string,
}

type CreateToken = (req: unknown) => TE.TaskEither<Error, CreateTokenResponse>

// export const createToken: CreateToken = req => pipe(

// )
