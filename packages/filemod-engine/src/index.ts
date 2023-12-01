export * from './types';
export * from './worker';
export * from './buildTransformApi';
export * from './buildDeclarativeFilemod';
export * from './buildDeclarativeTransform';

import { platform } from 'node:os';
import { executeMainThread } from './executeMainThread';

if (require.main === module) {
	if (platform() === 'win32') {
		throw new Error(`The filemod engine does no support Windows`);
	}

	executeMainThread().catch((error) => {
		console.error(error);
	});
}

export { executeMainThread };
