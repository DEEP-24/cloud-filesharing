import {redirect, type LoaderArgs} from '@remix-run/node'
import {db} from '~/lib/prisma.server'
import {badRequest} from '~/utils/misc.server'
import {deleteS3Object} from '~/utils/s3.server'

export async function loader({request}: LoaderArgs) {
	const token = new URL(request.url).searchParams.get('token')

	if (!token) {
		return badRequest({
			success: false,
			message: 'No token provided',
		})
	}
	const recepient = await db.recepients.findFirst({
		where: {
			token,
		},
		include: {
			file: {
				include: {
					recepients: true,
					_count: true,
				},
			},
		},
	})

	if (!recepient) {
		return badRequest({
			success: false,
			message: 'Invalid token',
		})
	}

	const accessedByAll =
		recepient.file._count.recepients ===
		recepient.file.recepients.filter(r => r.clicked).length

	if (accessedByAll) {
		deleteS3Object({
			key: recepient.file.url.split('/').pop()!,
			bucket: process.env.AWS_BUCKET_NAME!,
		})

		return badRequest({
			success: false,
			message: 'File is no longer available',
		})
	}

	await db.recepients.update({
		where: {
			email_fileId: {
				email: recepient.email,
				fileId: recepient.fileId,
			},
		},
		data: {
			clicked: true,
		},
	})

	return redirect(recepient.file.url)
}
