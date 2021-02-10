import { RequestHandler } from 'express';
import asyncHandler from 'express-async-handler';
import env from '../env';
import { getCacheKey } from '../utils/get-cache-key';
import cache from '../cache';
import { Transform, transforms } from 'json2csv';
import { PassThrough } from 'stream';

export const respond: RequestHandler = asyncHandler(async (req, res) => {
	if (
		req.method.toLowerCase() === 'get' &&
		env.CACHE_ENABLED === true &&
		cache &&
		!req.sanitizedQuery.export
	) {
		const key = getCacheKey(req);
		await cache.set(key, res.locals.payload);
	}

	if (req.sanitizedQuery.export) {
		let filename = '';

		if (req.collection) {
			filename += req.collection;
		} else {
			filename += 'Export';
		}

		filename += ' ' + getDateFormatted();

		if (req.sanitizedQuery.export === 'json') {
			res.attachment(`${filename}.json`);
			res.set('Content-Type', 'application/json');
			return res.status(200).send(JSON.stringify(res.locals.payload, null, '\t'));
		}

		if (req.sanitizedQuery.export === 'csv') {
			res.attachment(`${filename}.csv`);
			res.set('Content-Type', 'text/csv');
			const stream = new PassThrough();
			stream.end(Buffer.from(JSON.stringify(res.locals.payload.data), 'utf-8'));
			const json2csv = new Transform({
				transforms: [transforms.flatten({ separator: '.' })],
			});
			return stream.pipe(json2csv).pipe(res);
		}
	}

	return res.json(res.locals.payload);
});

function getDateFormatted() {
	const date = new Date();

	let month = String(date.getMonth() + 1);
	if (month.length === 1) month = '0' + month;

	let day = String(date.getDate());
	if (day.length === 1) day = '0' + day;

	return `${date.getFullYear()}-${month}-${day} at ${date.getHours()}.${date.getMinutes()}.${date.getSeconds()}`;
}
