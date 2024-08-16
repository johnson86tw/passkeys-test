import { logger } from './config'
import { Passkey, User } from './types'
import fs from 'fs'
import path from 'path'

type UserStore = { [id: string]: User }
type PasskeyStore = { [id: string]: Passkey[] }

// store data in JSON files

const usersFilePath = path.join(__dirname, 'users.json')
const passkeysFilePath = path.join(__dirname, 'passkeys.json')

function readJSONFile<T>(filePath: string): T {
	if (fs.existsSync(filePath)) {
		const data = fs.readFileSync(filePath, 'utf-8')
		return JSON.parse(data) as T
	}
	return {} as T
}

function writeJSONFile<T>(filePath: string, data: T) {
	fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

const users: UserStore = readJSONFile<UserStore>(usersFilePath)
const passkeys: PasskeyStore = readJSONFile<PasskeyStore>(passkeysFilePath)

export function addUser(user: User) {
	if (!users[user.id]) {
		users[user.id] = user
		writeJSONFile(usersFilePath, users)
		logger.info(`User added: ${user.id}`)
	} else {
		throw new Error('User already exists')
	}
}

export function getUser(id: string): User | undefined {
	return users[id]
}

export function addPasskey(user: User, passkey: Passkey) {
	if (!passkeys[user.id]) {
		passkeys[user.id] = []
	}
	passkeys[user.id].push(passkey)
	writeJSONFile(passkeysFilePath, passkeys)

	logger.info(`Passkey added: ${user.id} ${passkey.id}`)
}

export function getPasskeys(userId: string): Passkey[] | undefined {
	return passkeys[userId]
}

export function updatePasskeyCounter(userId: string, passkeyId: string, counter: number) {
	const userPasskeys = getPasskeys(userId)
	if (userPasskeys) {
		const passkey = userPasskeys.find(pk => pk.id === passkeyId)
		if (passkey) {
			passkey.counter = counter
			writeJSONFile(passkeysFilePath, passkeys)
		} else {
			throw new Error('Passkey not found')
		}
	} else {
		throw new Error('User not found')
	}
}
