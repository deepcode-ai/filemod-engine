import type {
	TransformApi,
	Command,
	Transform,
} from '@deepcode-ai/filemod-engine';
import path from 'node:path';

export default async function transform(
	rootDirectoryPath: string,
	api: TransformApi,
): Promise<ReadonlyArray<Command>> {
	rootDirectoryPath;

	const filePaths = await api.getFilePaths('**/pages/**/*.{js,jsx,ts,tsx}', [
		'**/node_modules/**',
		'**/pages/api/**',
	]);

	const commands: Command[] = [];

	for (const filePath of filePaths) {
		const { root, base, dir, ext } = path.parse(filePath);

		const fileRoot = base.slice(0, base.length - ext.length);

		const dirs = dir.split(path.sep);

		if (
			fileRoot === '_app' ||
			fileRoot === '_document' ||
			fileRoot === '_error'
		) {
			commands.push({
				kind: 'delete',
				path: filePath,
			});

			continue;
		}

		const newDirs = dirs.map((dir) => (dir === 'pages' ? 'app' : dir));

		if (fileRoot !== 'index') {
			newDirs.push(fileRoot);
		}

		commands.push({
			kind: 'move',
			fromPath: filePath,
			toPath: path.join(root, ...newDirs, `page${ext}`),
		});
	}

	return commands;
}

transform satisfies Transform;
