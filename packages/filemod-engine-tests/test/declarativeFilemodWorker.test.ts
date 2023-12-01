import {
	buildDeclarativeFilemod,
	buildDeclarativeTransform,
	buildFilePathTransformApi,
	TransformApi,
} from '@deepcode-ai/filemod-engine/';
import assert from 'node:assert';
import path from 'node:path';

describe('declarativeFilemodWorker', function () {
	it('should build a DeclarativeFilemod', async function () {
		const declarativeCodemod = await buildDeclarativeFilemod({
			filePath: path.join(__dirname, './transform.yml'),
		});

		assert.deepEqual(declarativeCodemod, {
			version: 1,
			posix: true,
			includePattern: '**/pages/**/*.{js,jsx,ts,tsx}',
			excludePatterns: ['**/node_modules/**', '**/pages/api/**'],
			deleteRules: {
				fileRoot: ['_app', '_document', '_error'],
			},
			copyRules: [
				{
					replaceDirectoryName: ['pages', 'app'],
				},
				{
					appendDirectoryName: [
						'@fileRoot',
						{
							fileRootNot: 'index',
						},
					],
				},
				{
					replaceFileRoot: 'page',
				},
			],
		});
	});

	it('should execute the declarative codemod correctly', async function () {
		const declarativeCodemod = await buildDeclarativeFilemod({
			filePath: path.join(__dirname, './transform.yml'),
		});

		const declarativeTransform =
			buildDeclarativeTransform(declarativeCodemod);

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

		const commands = await declarativeTransform(rootDirectoryPath, api);

		assert.deepEqual(commands, [
			{
				kind: 'copy',
				fromPath: '/opt/project/pages/index.tsx',
				toPath: '/opt/project/app/page.tsx',
			},
			{ kind: 'delete', path: '/opt/project/pages/_app.tsx' },
			{ kind: 'delete', path: '/opt/project/pages/_document.tsx' },
			{ kind: 'delete', path: '/opt/project/pages/_error.tsx' },
			{
				fromPath: '/opt/project/pages/[slug]/about.tsx',
				kind: 'copy',
				toPath: '/opt/project/app/[slug]/about/page.tsx',
			},
		]);
	});

	it('should use a declarative codemod using buildFilePathTransformApi', async function () {
		const declarativeCodemod = await buildDeclarativeFilemod({
			filePath: path.join(__dirname, './transform.yml'),
		});

		const declarativeTransform =
			buildDeclarativeTransform(declarativeCodemod);

		const rootDirectoryPath = '/opt/project/';

		const transformApi = buildFilePathTransformApi(
			rootDirectoryPath,
			'/opt/project/pages/[slug]/about.tsx',
		);

		const commands = await declarativeTransform(
			rootDirectoryPath,
			transformApi,
		);

		assert.deepEqual(commands, [
			{
				fromPath: '/opt/project/pages/[slug]/about.tsx',
				kind: 'copy',
				toPath: '/opt/project/app/[slug]/about/page.tsx',
			},
		]);
	});

	it('should use a declarative codemod using buildFilePathTransformApi (Buffer)', async function () {
		const declarativeCodemod = await buildDeclarativeFilemod({
			buffer: Buffer.from(
				'dmVyc2lvbjogMQpwb3NpeDogdHJ1ZQppbmNsdWRlUGF0dGVybjogIioqL3BhZ2VzLyoqLyoue2pzLGpzeCx0cyx0c3h9IgpleGNsdWRlUGF0dGVybnM6CiAgLSAiKiovbm9kZV9tb2R1bGVzLyoqIgogIC0gIioqL3BhZ2VzL2FwaS8qKiIKZGVsZXRlUnVsZXM6CiAgZmlsZVJvb3Q6CiAgICAtICJfYXBwIgogICAgLSAiX2RvY3VtZW50IgogICAgLSAiX2Vycm9yIgpyZXBsYWNlUnVsZXM6CiAgLSByZXBsYWNlRGlyZWN0b3J5TmFtZToKICAgICAgLSAicGFnZXMiCiAgICAgIC0gImFwcCIKICAtIGFwcGVuZERpcmVjdG9yeU5hbWU6CiAgICAgIC0gIkBmaWxlUm9vdCIKICAgICAgLSBmaWxlUm9vdE5vdDogImluZGV4IgogIC0gcmVwbGFjZUZpbGVSb290OiAicGFnZSIKdGVzdHM6CiAgLSAtICJtb3ZlIgogICAgLSAiL29wdC9wcm9qZWN0L3BhZ2VzL2luZGV4LnRzeCIKICAgIC0gIi9vcHQvcHJvamVjdC9hcHAvcGFnZS50c3giCg',
				'base64url',
			),
		});

		const declarativeTransform =
			buildDeclarativeTransform(declarativeCodemod);

		const rootDirectoryPath = '/opt/project/';

		const transformApi = buildFilePathTransformApi(
			rootDirectoryPath,
			'/opt/project/pages/[slug]/about.tsx',
		);

		const commands = await declarativeTransform(
			rootDirectoryPath,
			transformApi,
		);

		assert.deepEqual(commands, [
			{
				fromPath: '/opt/project/pages/[slug]/about.tsx',
				kind: 'move',
				toPath: '/opt/project/app/[slug]/about/page.tsx',
			},
		]);
	});
});
