import {
	redirect,
	type ActionFunction,
	type DataFunctionArgs,
} from '@remix-run/node'
import {useFetcher} from '@remix-run/react'
import {createUserSession, getUser} from '~/lib/session.server'
import {verifyLogin} from '~/lib/user.server'
import {badRequest} from '~/utils/misc.server'

export const loader = async ({request}: DataFunctionArgs) => {
	const user = await getUser(request)
	if (user) return redirect('/')

	return null
}

interface ActionData {
	fieldErrors?: {
		email?: string
		password?: string
	}
}

export const action: ActionFunction = async ({request}) => {
	const formData = await request.formData()

	const email = formData.get('email')?.toString().trim()
	const password = formData.get('password')?.toString().trim()

	const errors: ActionData['fieldErrors'] = {}
	if (!email) {
		errors.email = 'Email is required'
	}
	if (!password) {
		errors.password = 'Password is required'
	}

	if (Object.keys(errors).length > 0) {
		return badRequest<ActionData>({fieldErrors: errors})
	}

	const user = await verifyLogin(email!, password!)
	if (!user) {
		return badRequest<ActionData>({
			fieldErrors: {
				password: 'Invalid username or password',
			},
		})
	}

	return createUserSession({
		request,
		userId: user.id,
	})
}

export default function Login() {
	const fetcher = useFetcher<ActionData>()

	const isSubmitting = fetcher.state !== 'idle'

	return (
		<div
			style={{
				display: 'flex',
				minHeight: '100%',
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			<div
				style={{
					margin: '0 auto',
				}}
			>
				<h2>Login</h2>

				<fetcher.Form
					method="post"
					replace
					style={{
						marginTop: '1rem',
					}}
				>
					<fieldset
						disabled={isSubmitting}
						style={{
							marginTop: '1rem',
							display: 'flex',
							flexDirection: 'column',
							gap: '1rem',
						}}
					>
						<div
							style={{
								marginTop: '1rem',
								display: 'flex',
								flexDirection: 'column',
								gap: '1rem',
							}}
						>
							<label htmlFor="email">Email</label>
							<input
								id="email"
								name="email"
								type="email"
								autoComplete="email"
								required
							/>
							{fetcher.data?.fieldErrors?.email ? (
								<p
									style={{
										color: 'red',
									}}
								>
									{fetcher.data?.fieldErrors?.email}
								</p>
							) : null}
						</div>

						<div
							style={{
								marginTop: '1rem',
								display: 'flex',
								flexDirection: 'column',
								gap: '1rem',
							}}
						>
							<label htmlFor="password">Password</label>
							<input
								id="password"
								type="password"
								name="password"
								autoComplete="current-password"
								required
							/>
							{fetcher.data?.fieldErrors?.password ? (
								<p
									style={{
										color: 'red',
									}}
								>
									{fetcher.data?.fieldErrors?.password}
								</p>
							) : null}
						</div>

						<button type="submit" disabled={isSubmitting}>
							Sign in
						</button>
					</fieldset>
				</fetcher.Form>
			</div>
		</div>
	)
}
