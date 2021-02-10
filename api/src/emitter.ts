import { EventEmitter2 } from 'eventemitter2';
import logger from './logger';

const emitter = new EventEmitter2({ wildcard: true, verboseMemoryLeak: true, delimiter: '.' });

// No-op function to ensure we never end up with no data
emitter.on('*.*.before', (input) => input);

/**
 * Emit async events without throwing errors. Just log them out as warnings.
 * @param name
 * @param args
 */
export async function emitAsyncSafe(name: string, ...args: any[]) {
	try {
		return await emitter.emitAsync(name, ...args);
	} catch (err) {
		logger.warn(`An error was thrown while executing hook "${name}"`);
		logger.warn(err);
	}
	return [];
}

export default emitter;
