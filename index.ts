import 'dotenv/config';
import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import { APIInteraction, InteractionResponseType, InteractionType } from 'discord-api-types/v10';
import { verify } from 'discord-verify/node';

const PUBLIC_KEY = process.env.PUBLIC_KEY as string;

const fastify = Fastify({
	logger: true,
});

fastify.get('/interactions', (req, res) => {
	fastify.log.info('Handling GET request');
});

fastify.addHook(
	'preHandler',
	async (
		req: FastifyRequest<{
			Body: APIInteraction;
			Headers: {
				'x-signature-ed25519': string;
				'x-signature-timestamp': string;
			};
		}>,
		res: FastifyReply
	) => {
		if (req.method === 'POST') {
			const signature = req.headers['x-signature-ed25519'];
			const timestamp = req.headers['x-signature-timestamp'];
			const rawBody = JSON.stringify(req.body);

			const isValid = await verify(rawBody, signature, timestamp, PUBLIC_KEY, crypto.subtle);

			if (!isValid) {
				fastify.log.info('Invalid signature');
				return res.code(401).send('Invalid signature');
			}
		}
	}
);

fastify.post('/interactions', (req, res) => {
	const message = req.body as APIInteraction;

	if (message.type === InteractionType.Ping) {
		fastify.log.info('Handling Ping Request');
		return res.send({ type: InteractionResponseType.Pong });
	} else {
		fastify.log.error('Unknown Type');
		return res.send({ error: 'Unknown Type' });
	}
});

fastify.listen({ port: 3000 }, (err, address) => {
	if (err) {
		fastify.log.error(err);
		process.exit(1);
	}
});
