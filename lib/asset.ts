export const BASE_PATH = process.env.NODE_ENV === 'production' ? '/vanh' : ''

export const asset = (p: string) => `${BASE_PATH}${p}`
