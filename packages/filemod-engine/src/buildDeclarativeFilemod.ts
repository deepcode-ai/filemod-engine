// the worker for declarative filemods
import * as S from '@fp-ts/schema';
import { readFile } from 'node:fs';
import { promisify } from 'node:util';
import jsYaml from 'js-yaml';

const promisifiedReadFile = promisify(readFile);

const declarativeRuleSchema = S.union(
	S.struct({
		replaceDirectoryName: S.tuple(S.string, S.string),
	}),
	S.struct({
		appendDirectoryName: S.tuple(
			S.string,
			S.struct({
				fileRootNot: S.optional(S.string),
			}),
		),
	}),
	S.struct({
		replaceFileRoot: S.string,
	}),
);

const declarativeFilemodSchema = S.struct({
	version: S.number,
	posix: S.boolean,
	includePattern: S.string,
	excludePatterns: S.array(S.string),
	deleteRules: S.optional(
		S.struct({
			fileRoot: S.optional(S.array(S.string)),
		}),
	),
	replaceRules: S.optional(S.array(declarativeRuleSchema)),
	copyRules: S.optional(S.array(declarativeRuleSchema)),
});

export type DeclarativeFilemod = S.Infer<typeof declarativeFilemodSchema>;
export type DeclarativeRule = S.Infer<typeof declarativeRuleSchema>;

export type BuildDeclarativeFilemodArgument =
	| Readonly<{
			filePath: string;
	  }>
	| Readonly<{
			buffer: Buffer;
	  }>;

export const buildDeclarativeFilemod = async (
	arg: BuildDeclarativeFilemodArgument,
): Promise<DeclarativeFilemod> => {
	let str: string;

	if ('filePath' in arg) {
		str = await promisifiedReadFile(arg.filePath, { encoding: 'utf8' });
	} else {
		str = arg.buffer.toString('utf8');
	}

	const yml = jsYaml.load(str, {
		filename: 'filePath' in arg ? arg.filePath : undefined,
	});

	return S.decodeOrThrow(declarativeFilemodSchema)(yml, {
		isUnexpectedAllowed: true,
	});
};
