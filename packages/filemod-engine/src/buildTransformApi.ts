import glob from 'glob';
import { promisify } from 'node:util';
import { TransformApi } from './types';
import { Volume } from 'memfs';

const promisifiedGlob = promisify(glob);

export const buildTransformApi = (
	rootDirectoryPath: string,
	fs?: typeof import('fs'),
): TransformApi => {
	const getFilePaths = (
		includePattern: string,
		excludePatterns: ReadonlyArray<string>,
	) =>
		promisifiedGlob(includePattern, {
			absolute: true,
			cwd: rootDirectoryPath,
			fs,
			ignore: excludePatterns,
		});

	return {
		getFilePaths,
	};
};

export const buildFilePathTransformApi = (
	rootDirectoryPath: string,
	filePath: string,
): TransformApi => {
	const fs = Volume.fromJSON({
		[filePath]: '',
	});

	const getFilePaths = (
		includePattern: string,
		excludePatterns: ReadonlyArray<string>,
	) =>
		promisifiedGlob(includePattern, {
			absolute: true,
			cwd: rootDirectoryPath,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			fs: fs as any,
			ignore: excludePatterns,
		});

	return {
		getFilePaths,
	};
};
