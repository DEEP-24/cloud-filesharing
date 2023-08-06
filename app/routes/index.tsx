import type {ActionArgs, DataFunctionArgs} from '@remix-run/node'
import {json} from '@remix-run/node'
import {useFetcher} from '@remix-run/react'
import axios from 'axios'
import * as mime from 'mime-types'
import * as React from 'react'
import invariant from 'tiny-invariant'
import {db} from '~/lib/prisma.server'
import {requireUser} from '~/lib/session.server'
import {sendEmail} from '~/utils/mail.server'
import {badRequest} from '~/utils/misc.server'
import {getS3Url, getUniqueS3Key} from '~/utils/s3-utils.client'

export const loader = async ({request}: DataFunctionArgs) => {
	await requireUser(request)
	return null
}

export const action = async ({request}: ActionArgs) => {
	const SERVER_URL = process.env.SERVER_URL
	invariant(SERVER_URL, 'Missing SERVER_URL env var')

	const user = await requireUser(request)
	const formData = await request.formData()

	const url = formData.get('url')?.toString()
	const contentType = formData.get('contentType')?.toString()
	const emails = formData.getAll('email')

	if (!url || !contentType || !emails) {
		return badRequest({
			success: false,
		})
	}

	if (emails.length === 0) {
		return badRequest({
			success: false,
		})
	}

	const _emails = emails
		.map(email => email.toString().trim().toLowerCase())
		.filter(Boolean)

	const file = await db.file.create({
		data: {
			url,
			type: contentType,
			userId: user.id,
			recepients: {
				createMany: {
					data: _emails.map(email => ({
						email,
						token: Math.random().toString(36).slice(2),
					})),
				},
			},
		},
		include: {
			recepients: true,
		},
	})

	for (const recepient of file.recepients) {
		await sendEmail({
			to: recepient.email,
			subject: `${user.name} shared a new file!`,
			text: `${SERVER_URL}/access-file?token=${recepient.token}`,
			html: `<a href="${SERVER_URL}/access-file?token=${recepient.token}">this link</a>`,
		})

		await new Promise(resolve => setTimeout(resolve, 1000))
	}

	return json({
		success: true,
	})
}

export default function Index() {
	const fetcher = useFetcher()
	const isSubmitting = fetcher.state !== 'idle'

	const formRef = React.useRef<HTMLFormElement>(null)
	const [file, setFile] = React.useState<File | null>(null)
	const [isFileUploading, setIsFileUploadin] = React.useState(false)

	const fileKey = React.useMemo(() => {
		if (!file) return null

		const extension = mime.extension(file.type)
		const key = getUniqueS3Key(
			file.name,
			extension ? `.${extension}` : undefined
		)

		return key
	}, [file])

	React.useEffect(() => {
		if (isSubmitting) {
			return
		}

		if (!fetcher.data) return

		if (fetcher.data.success) {
			formRef.current?.reset()
			setIsFileUploadin(false)
		}
	}, [fetcher.data, isSubmitting])

	const handleFileUpload = async () => {
		if (!file || !fileKey) {
			return null
		}

		const data = await axios.get<{
			signedUrl: string
		}>(`/api/s3?key=${fileKey}`)

		const uploadUrl = data.data.signedUrl

		const contentType = mime.contentType(file.type)
		const response = await axios.put(uploadUrl, file, {
			headers: {
				'Content-Type': contentType,
			},
		})
		if (response.status === 200) {
			return {
				url: getS3Url(fileKey),
				contentType: contentType || '',
			}
		} else {
			return null
		}
	}

	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				gap: '1rem',
			}}
		>
			<div
				style={{
					marginLeft: 'auto',
					marginRight: 'auto',
					maxWidth: '58rem',
					padding: '1rem',
				}}
			>
				<div
					style={{
						marginTop: '2rem',
					}}
				>
					<fetcher.Form
						method="post"
						replace
						ref={formRef}
						style={{
							marginTop: '2rem',
							maxWidth: '58rem',
						}}
						onSubmit={async e => {
							e.preventDefault()
							setIsFileUploadin(true)
							const formData = new FormData(e.currentTarget)

							if (!file || !fileKey) return

							const data = await handleFileUpload()

							if (!data) {
								setIsFileUploadin(false)
								return
							}

							formData.append('url', data.url)
							formData.append('contentType', data.contentType)

							fetcher.submit(formData, {
								method: 'post',
								replace: true,
							})
						}}
					>
						<fieldset
							disabled={isSubmitting}
							style={{
								display: 'flex',
								flexDirection: 'column',
								gap: '1rem',
							}}
						>
							<input
								type="file"
								onChange={e => setFile(e.currentTarget.files?.[0] ?? null)}
							/>

							<input name="email" type="email" placeholder="Enter email" />
							<input name="email" type="email" placeholder="Enter email" />
							<input name="email" type="email" placeholder="Enter email" />
							<input name="email" type="email" placeholder="Enter email" />
							<input name="email" type="email" placeholder="Enter email" />

							<div
								className=""
								style={{
									marginTop: '1rem',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'flex-end',
									gap: '1rem',
								}}
							>
								<button
									type="submit"
									disabled={isSubmitting || isFileUploading}
								>
									Send Email
								</button>
							</div>
						</fieldset>
					</fetcher.Form>
				</div>
			</div>
		</div>
	)
}
