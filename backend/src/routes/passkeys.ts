import { Express } from 'express'
import {
	generateRegistrationOptions,
	verifyRegistrationResponse,
	generateAuthenticationOptions,
	verifyAuthenticationResponse,
} from '@simplewebauthn/server'
import { isoUint8Array } from '@simplewebauthn/server/helpers'
import { addPasskey, addUser, getPasskeys, getUser } from '../db'
import { Passkey, User } from '../types'
import { FRONTEND_URL } from '../config'
import { challengeStore } from '../cache'
import { RegistrationResponseJSON } from '@simplewebauthn/types'

export const rpName = 'Passkeys Test'
export const rpID = 'localhost' // Note: cannot include port number
export const origin = `http://${rpID}:3000`

export default (app: Express) => {
	app.post('/start-registering', async (req, res) => {
		try {
			const username = req.body.username
			if (!username) {
				throw new Error('Username is required')
			}

			let user = getUser(username)
			if (!user) {
				addUser({
					id: username,
					username: username,
				})
				user = getUser(username) as User
			}
			const passkeys = getPasskeys(user.id)

			let excludeCredentials
			if (passkeys && passkeys.length) {
				passkeys.map((passkey: Passkey) => ({
					id: passkey.id,
					type: 'public-key',
					transports: passkey.transports,
				}))
			}

			const options = await generateRegistrationOptions({
				rpName,
				rpID,
				userID: isoUint8Array.fromUTF8String(user.id),
				userName: username,
				userDisplayName: username,
				attestationType: 'direct',
				authenticatorSelection: {
					residentKey: 'required',
					userVerification: 'preferred',
				},
				// 設定要排除的驗證器，避免驗證器重複註冊
				excludeCredentials,
				timeout: 300000, // 5 minutes
			})

			challengeStore.addChallenge(user.id, options.challenge)

			res.json({
				data: {
					options,
				},
			})
		} catch (e: any) {
			res.status(500).json({ error: e.message })
		}
	})

	app.post('/register', async (req, res) => {
		try {
			const registration: RegistrationResponseJSON = req.body.registration
			if (!registration) {
				throw new Error('Registration data is required')
			}

			const username = req.body.username
			if (!username) {
				throw new Error('Username is required')
			}

			const user = getUser(username)
			if (!user) {
				throw new Error('User not found')
			}

			const expectedChallenge = challengeStore.getChallenge(user.id)
			if (!expectedChallenge) {
				throw new Error('Challenge not found')
			}

			const verification = await verifyRegistrationResponse({
				response: registration,
				expectedChallenge,
				expectedOrigin: FRONTEND_URL,
				requireUserVerification: true,
			})

			const { verified, registrationInfo } = verification

			if (verified && registrationInfo) {
				const { credentialPublicKey, credentialID, counter } = registrationInfo

				const passkey: Passkey = {
					id: credentialID,
					publicKey: credentialPublicKey,
					counter,
					transports: registration.response.transports,
					user: user,
					webauthnUserID: credentialID, // what's this?
					deviceType: 'multiDevice',
					backedUp: false, // what's this?
				}

				addPasskey(user, passkey)

				challengeStore.removeChallenge(user.id)

				return res.status(200).send({
					data: {
						verified: true,
					},
				})
			} else {
				return res.status(500).send({
					data: {
						verified: false,
					},
				})
			}
		} catch (e: any) {
			res.status(500).json({ error: e.message })
		}
	})

	app.get('/start-authenticating', (_, res) =>
		res.json({
			data: {
				options: null,
			},
		}),
	)

	app.post('/authenticate', async (req, res) => {
		res.json({ data: { verified: false } })
	})
}
