import type {DataFunctionArgs} from '@remix-run/node'
import {logout} from '~/lib/session.server'

export const loader = async ({request}: DataFunctionArgs) => {
	return logout(request)
}
