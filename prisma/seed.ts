import {PrismaClient} from '@prisma/client'
import {hashPassword} from '~/utils/misc.server'

const db = new PrismaClient()

async function seed() {
	await db.user.deleteMany()

	await db.user.create({
		data: {
			name: 'John',
			email: 'john@doe.com',
			password: await hashPassword('password'),
		},
	})

	console.log(`Database has been seeded. 🌱`)
}

seed()
	.catch(e => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await db.$disconnect()
	})
