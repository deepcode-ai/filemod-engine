import type { ReadStream, WriteStream } from 'node:fs';

export type Command = Readonly<
	| {
			kind: 'delete';
			path: string;
	  }
	| {
			kind: 'move' | 'copy';
			fromPath: string;
			toPath: string;
	  }
	| {
			kind: 'create';
			path: string;
	  }
>;

export type TransformApi = Readonly<{
	getFilePaths: (
		includePattern: string,
		excludePatterns: ReadonlyArray<string>,
	) => Promise<ReadonlyArray<string>>;
}>;

export type Transform = (
	rootDirectoryPath: string,
	api: TransformApi,
) => Promise<ReadonlyArray<Command>>;

export type CommandApi = Readonly<{
	unlink: (path: string) => Promise<void>;
	dirname: (path: string) => string;
	mkdir: (path: string) => Promise<void>;
	createReadStream: (path: string) => ReadStream;
	createWriteStream: (path: string) => WriteStream;
	writeFile: (path: string, data: string) => Promise<void>;
}>;
