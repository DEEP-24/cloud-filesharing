import type {User} from '@prisma/client'
import {createCookieSessionStorage, redirect} from '@remix-run/node'
import invariant from 'tiny-invariant'
import {getUserById} from '~/lib/user.server'

invariant(process.env.SESSION_SECRET, 'SESSION_SECRET must be set')

export const sessionStorage = createCookieSessionStorage({
	cookie: {
		name: '__cloud_session',
		httpOnly: true,
		maxAge: 0,
		path: '/',
		sameSite: 'lax',
		secrets: [process.env.SESSION_SECRET],
		secure: false,
	},
})

const USER_SESSION_KEY = 'userId'
const thirtyDaysInSeconds = 60 * 60 * 24 * 30

export async function getSession(request: Request) {
	const cookie = request.headers.get('Cookie')
	return sessionStorage.getSession(cookie)
}

/**
 * Returns the userId from the session.
 */
export async function getUserId(
	request: Request
): Promise<User['id'] | undefined> {
	const session = await getSession(request)
	const userId = session.get(USER_SESSION_KEY)
	return userId
}

export async function getUser(request: Request) {
	const userId = await getUserId(request)
	if (userId === undefined) return null

	const user = await getUserById(userId)
	if (user) return user

	throw await logout(request)
}

export async function requireUserId(
	request: Request,
	redirectTo: string = new URL(request.url).pathname
) {
	const userId = await getUserId(request)
	if (!userId) {
		const searchParams = new URLSearchParams([['redirectTo', redirectTo]])
		throw redirect(`/login?${searchParams}`)
	}

	return userId
}

export async function requireUser(
	request: Request,
	redirectTo: string = new URL(request.url).pathname
) {
	const userId = await requireUserId(request, redirectTo)
	const user = await getUserById(userId)
	if (user) return user

	throw await logout(request)
}

export async function createUserSession({
	request,
	userId,
}: {
	request: Request
	userId: User['id']
}) {
	const session = await getSession(request)
	session.set(USER_SESSION_KEY, userId)

	return redirect('/', {
		headers: {
			'Set-Cookie': await sessionStorage.commitSession(session, {
				maxAge: thirtyDaysInSeconds,
			}),
		},
	})
}

export async function logout(request: Request) {
	const session = await getSession(request)

	// For some reason destroySession isn't removing session keys
	// So, unsetting the keys manually
	session.unset(USER_SESSION_KEY)

	return redirect('/login', {
		headers: {
			'Set-Cookie': await sessionStorage.destroySession(session),
		},
	})
}
