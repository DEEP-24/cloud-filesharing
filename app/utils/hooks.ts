import {useRouteLoaderData} from '@remix-run/react'
import type {RootLoaderData} from '~/root'

export function useOptionalUser() {
	return useRouteLoaderData('root') as RootLoaderData
}

export function useUser() {
	const {user} = useOptionalUser()

	if (!user) {
		throw new Error('User is not logged in')
	}

	return user
}
