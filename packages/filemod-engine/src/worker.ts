import { mkdir, unlink, writeFile } from 'fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { register } from 'ts-node';
import { Command, CommandApi, Transform } from './types';
import { pipeline } from 'node:stream';
import { dirname, extname } from 'path';
import { buildTransformApi } from './buildTransformApi';
import { buildDeclarativeFilemod } from './buildDeclarativeFilemod';
import { buildDeclarativeTransform } from './buildDeclarativeTransform';

export const buildRegisterTsNodeOnce = () => {
	let registered = false;

	return () => {
		if (registered) {
			return;
		}

		register({
			transpileOnly: true,
			typeCheck: false,
		});

		registered = true;
	};
};

export const registerTsNode = buildRegisterTsNodeOnce();

export const buildTransform = (filePath: string): Transform => {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const result = require(filePath);

	if (
		!result ||
		!('default' in result) ||
		typeof result.default !== 'function' ||
		!('length' in result.default) ||
		result.default.length < 2
	) {
		throw new Error(
			'The transform file does not conform to the requirements',
		);
	}

	return result.default;
};

export const buildCommandApi = (): CommandApi => {
	return {
		unlink: (path) => unlink(path),
		dirname: (path) => dirname(path),
		mkdir: async (path) => {
			await mkdir(path, { recursive: true });
		},
		createReadStream: (path) => createReadStream(path),
		createWriteStream: (path) => createWriteStream(path, { flags: 'w+' }),
		writeFile: (path, data) => writeFile(path, data),
	};
};

export const executeCommand = async (
	command: Command,
	api: CommandApi,
): Promise<void> => {
	switch (command.kind) {
		case 'delete': {
			await api.unlink(command.path);
			return;
		}

		case 'move':
		case 'copy': {
			const dir = api.dirname(command.toPath);

			await api.mkdir(dir);

			await new Promise<void>((resolve, reject) => {
				pipeline(
					api.createReadStream(command.fromPath),
					api.createWriteStream(command.toPath),
					(err) => {
						if (err) {
							reject(err);
							return;
						}

						resolve();
					},
				);
			});

			if (command.kind === 'move') {
				await api.unlink(command.fromPath);
			}

			return;
		}

		case 'create': {
			await api.writeFile(command.path, '');
			return;
		}
	}
};

export const handleCliArguments = async (
	transformFilePath: string,
	rootDirectoryPath: string,
	dryRun: boolean,
): Promise<void> => {
	const ext = extname(transformFilePath);

	let transform: Transform;

	if (ext === '.yml' || ext === '.yaml') {
		const declarativeFilemod = await buildDeclarativeFilemod({
			filePath: transformFilePath,
		});

		transform = buildDeclarativeTransform(declarativeFilemod);
	} else {
		registerTsNode();

		transform = buildTransform(transformFilePath);
	}

	const transformApi = buildTransformApi(rootDirectoryPath);

	const commands = await transform(rootDirectoryPath, transformApi);

	if (dryRun) {
		console.log(commands);
		return;
	}

	const commandApi = buildCommandApi();

	for (const command of commands) {
		await executeCommand(command, commandApi);
	}
};
