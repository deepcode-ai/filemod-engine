import { buildTransform, TransformApi } from '@deepcode-ai/filemod-engine';
import assert from 'node:assert';
import path from 'node:path';
import { Volume } from 'memfs';
import glob from 'glob';
import { promisify } from 'node:util';

const promisifiedGlob = promisify(glob);

describe('worker', function () {
	it('should get the proper directory names', () => {
		const parsedPath = path.parse('/opt/project/pages/[slug]/about.tsx');
		const dirs = parsedPath.dir.split(path.sep);

		assert.deepEqual(dirs, ['', 'opt', 'project', 'pages', '[slug]']);
	});

	it('should report correct paths', async function () {
		const rootDirectoryPath = '/opt/project/';

		const fs = Volume.fromJSON({
			'/opt/project/pages/index.js': '',
			'/opt/project/pages/_app.tsx': 'aaa',
			'/opt/project/pages/_document.jsx': '',
			'/opt/project/pages/_error.tsx': '',
			'/opt/project/pages/[slug]/about.tsx': '',
			'/opt/project/pages/api/index.ts': '',
			'/opt/project/node_modules/lib/pages/a/index.ts': '',
		});

		const filePaths = await promisifiedGlob(
			'**/pages/**/*.{js,jsx,ts,tsx}',
			{
				absolute: true,
				cwd: rootDirectoryPath,
				ignore: ['**/node_modules/**', '**/pages/api/**'],
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				fs: fs as any,
			},
		);

		assert.deepEqual(filePaths, [
			'/opt/project/pages/_app.tsx',
			'/opt/project/pages/_document.jsx',
			'/opt/project/pages/_error.tsx',
			'/opt/project/pages/[slug]/about.tsx',
			'/opt/project/pages/index.js',
		]);
	});

	it('should produce correct commands', async function () {
		const filePath = path.join(__dirname, './transform.ts');

		const transform = buildTransform(filePath);

		if (!transform) {
			throw new Error('no transform function');
		}

		assert.notStrictEqual(transform, null);

		const rootDirectoryPath = '/opt/project/';

		const api: TransformApi = {
			async getFilePaths() {
				return [
					'/opt/project/pages/index.tsx',
					'/opt/project/pages/_app.tsx',
					'/opt/project/pages/_document.tsx',
					'/opt/project/pages/_error.tsx',
					'/opt/project/pages/[slug]/about.tsx',
				];
			},
		};

		const commands = await transform(rootDirectoryPath, api);

		assert.deepEqual(commands, [
			{
				kind: 'move',
				fromPath: '/opt/project/pages/index.tsx',
				toPath: '/opt/project/app/page.tsx',
			},
			{ kind: 'delete', path: '/opt/project/pages/_app.tsx' },
			{ kind: 'delete', path: '/opt/project/pages/_document.tsx' },
			{ kind: 'delete', path: '/opt/project/pages/_error.tsx' },
			{
				fromPath: '/opt/project/pages/[slug]/about.tsx',
				kind: 'move',
				toPath: '/opt/project/app/[slug]/about/page.tsx',
			},
		]);
	});
});
