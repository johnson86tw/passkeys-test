import { Express } from 'express'
import { LOG_LEVEL } from '../config'
import { rpID, rpName } from './passkeys'

export default (app: Express) => {
	app.get('/', (_, res) => res.json({ message: 'Hello, world!' }))
	app.get('/config', (_, res) =>
		res.json({
			config: {
				log_level: LOG_LEVEL || null,
				rp_name: rpName,
				rp_id: rpID,
			},
		}),
	)
}
