import {json} from '@remix-run/node'
import * as bcrypt from 'bcryptjs'

export const badRequest = <T = any>(data: T) => json<T>(data, {status: 400})
export const unauthorized = <T = any>(data: T) => json<T>(data, {status: 401})
export const forbidden = <T = any>(data: T) => json<T>(data, {status: 403})
export const notFound = <T = any>(data: T) => json<T>(data, {status: 404})

export function hashPassword(password: string) {
	return bcrypt.hash(password, 10)
}
