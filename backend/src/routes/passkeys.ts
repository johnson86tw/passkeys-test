import { Express } from 'express'
import {
	generateRegistrationOptions,
	verifyRegistrationResponse,
	generateAuthenticationOptions,
	verifyAuthenticationResponse,
} from '@simplewebauthn/server'

export const rpName = 'Passkeys Test'
export const rpID = 'localhost:3000'
export const origin = `http://${rpID}`

export default (app: Express) => {
	app.get('/start-registering', (_, res) =>
		res.json({
			data: {
				options: null,
			},
		}),
	)

	app.post('/register', async (req, res) => {
		res.json({ data: { verified: false } })
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
