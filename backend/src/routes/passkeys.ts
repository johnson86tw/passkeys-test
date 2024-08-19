import { Express } from 'express'
import {
	generateRegistrationOptions,
	verifyRegistrationResponse,
	generateAuthenticationOptions,
	verifyAuthenticationResponse,
} from '@simplewebauthn/server'
import { isoBase64URL, isoUint8Array } from '@simplewebauthn/server/helpers'
import { addPasskey, addUser, getPasskeys, getUser, updatePasskeyCounter } from '../db'
import { Passkey, User } from '../types'
import { FRONTEND_URL, logger } from '../config'
import { loginChallengeStore, registerChallengeStore } from '../cache'
import {
	RegistrationResponseJSON,
	PublicKeyCredentialRequestOptionsJSON,
	AuthenticationResponseJSON,
	AuthenticatorAssertionResponseJSON,
} from '@simplewebauthn/types'

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

			registerChallengeStore.addChallenge(user.id, options.challenge)

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

			const expectedChallenge = registerChallengeStore.getChallenge(user.id)
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

				registerChallengeStore.removeChallenge(user.id)

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

	app.post('/start-authenticating', async (req, res) => {
		try {
			const username = req.body.username
			if (!username) {
				throw new Error('Username is required')
			}

			const user = getUser(username)
			if (!user) {
				throw new Error('User not found')
			}

			const passkeys = getPasskeys(user.id)
			if (!passkeys) {
				throw new Error('Passkeys not found')
			}

			const options: PublicKeyCredentialRequestOptionsJSON = await generateAuthenticationOptions({
				rpID,
				// Require users to use a previously-registered authenticator
				allowCredentials: passkeys.map(passkey => ({
					id: passkey.id,
					transports: passkey.transports,
					counter: passkey.counter,
				})),
			})

			loginChallengeStore.addChallenge(user.id, options.challenge)

			res.json({
				data: {
					options,
				},
			})
		} catch (e: any) {
			res.status(500).json({ error: e.message })
		}
	})

	app.post('/authenticate', async (req, res) => {
		try {
			const authentication: AuthenticationResponseJSON = req.body.authentication
			if (!authentication) {
				throw new Error('Authentication data is required')
			}

			const username = req.body.username
			if (!username) {
				throw new Error('Username is required')
			}

			const user = getUser(username)
			if (!user) {
				throw new Error('User not found')
			}

			const expectedChallenge = loginChallengeStore.getChallenge(user.id)
			if (!expectedChallenge) {
				throw new Error('Challenge not found')
			}

			const passkeys = getPasskeys(user.id)
			if (!passkeys) {
				throw new Error('Passkeys not found')
			}

			const passkey = passkeys.find(pk => pk.id === authentication.id)
			if (!passkey) {
				throw new Error('Passkey not found')
			}

			logger.info(`counter: ${passkey.counter}`)

			let verification

			verification = await verifyAuthenticationResponse({
				response: authentication,
				expectedChallenge,
				expectedOrigin: FRONTEND_URL,
				expectedRPID: rpID,
				authenticator: {
					credentialID: passkey.id,
					credentialPublicKey: passkey.publicKey,
					counter: passkey.counter,
					transports: passkey.transports,
				},
			})

			const { verified } = verification

			if (verified) {
				loginChallengeStore.removeChallenge(user.id)
				logger.info(`Authentication successful: ${user.username}`)

				// update the user's authenticator's counter property in the DB
				// https://simplewebauthn.dev/docs/packages/server#3-post-authentication-responsibilities

				// Issue: Passkey Counter always 0 MacOS
				// https://stackoverflow.com/questions/78776653/passkey-counter-always-0-macos

				// Function to extract the counter from authenticatorData
				// function getCounterFromAuthenticatorData(
				// 	authenticatorData: AuthenticatorAssertionResponseJSON['authenticatorData'],
				// ) {
				// 	const buffer = Buffer.from(isoBase64URL.toBuffer(authenticatorData))
				// 	const counterBuffer = buffer.slice(33, 37) // The counter is located in these 4 bytes
				// 	const counter = counterBuffer.readUInt32BE(0)
				// 	return counter
				// }

				// updatePasskeyCounter(user.id, passkey.id, passkey.counter + 1)

				// @todo 驗證成功，創建 session 或發 token 等登入後要做的事情
			}

			res.json({ data: { verified } })
		} catch (e: any) {
			res.status(500).json({ error: e.message })
		}
	})
}
