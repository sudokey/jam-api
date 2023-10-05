export const gt = (a: number) => (b: number) => b > a

export const maxLength = <T extends string>(l: number) => (s: T) => s.length <= l
