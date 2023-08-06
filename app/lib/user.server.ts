import type {User} from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import {db} from '~/lib/prisma.server'

export async function getUserById(id: User['id']) {
	return db.user.findUnique({
		where: {id},
		select: {
			id: true,
			name: true,
			email: true,
		},
	})
}

export async function verifyLogin(email: User['email'], password: string) {
	const userWithPassword = await db.user.findUnique({
		where: {email},
	})

	if (!userWithPassword || !userWithPassword.password) {
		return null
	}

	const isValid = await bcrypt.compare(password, userWithPassword.password)

	if (!isValid) {
		return null
	}

	const {password: _password, ...userWithoutPassword} = userWithPassword

	return userWithoutPassword
}
