import type {LoaderArgs, MetaFunction, SerializeFrom} from '@remix-run/node'
import {json} from '@remix-run/node'
import {
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
} from '@remix-run/react'
import {getUser} from './lib/session.server'

export type RootLoaderData = SerializeFrom<typeof loader>
export const loader = async ({request}: LoaderArgs) => {
	const user = await getUser(request)
	return json({
		user,
		ENV: {
			AWS_BUCKET: process.env.AWS_BUCKET,
			AWS_REGION: process.env.AWS_REGION,
		},
	})
}

export const meta: MetaFunction = () => ({
	charset: 'utf-8',
	title: 'File Uploader',
	viewport: 'width=device-width,initial-scale=1',
})

export default function App() {
	const data = useLoaderData<RootLoaderData>()
	return (
		<html lang="en" className="h-full">
			<head>
				<title>File Uploader</title>
				<Meta />
				<Links />
			</head>
			<body className="h-full">
				<Outlet />
				<ScrollRestoration />
				<Scripts />
				<LiveReload />
				<script
					dangerouslySetInnerHTML={{
						__html: `
              window.ENV = ${JSON.stringify(data.ENV)};
            `,
					}}
				/>
			</body>
		</html>
	)
}
