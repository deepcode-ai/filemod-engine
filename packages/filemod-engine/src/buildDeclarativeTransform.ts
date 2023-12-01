import path, { ParsedPath } from 'node:path';
import { DeclarativeFilemod, DeclarativeRule } from './buildDeclarativeFilemod';
import { Command, Transform } from './types';

type DeleteRule = {
	kind: 'fileRootEqual';
	value: string;
};

type Rule =
	| {
			kind: 'replaceDirName';
			fromValue: string;
			toValue: string;
	  }
	| {
			kind: 'appendDirName';
			condition: {
				kind: 'fileRootNotEqual';
				value: string;
			};
			replacement:
				| {
						kind: 'value';
						value: string;
				  }
				| {
						kind: '@fileRoot';
				  };
	  }
	| {
			kind: 'replaceFileRoot';
			value: string;
	  };

const handleDeclarativeRule = (rule: DeclarativeRule): ReadonlyArray<Rule> => {
	const rules: Rule[] = [];

	if ('replaceDirectoryName' in rule) {
		rules.push({
			kind: 'replaceDirName',
			fromValue: rule.replaceDirectoryName[0],
			toValue: rule.replaceDirectoryName[1],
		});
	}

	if ('appendDirectoryName' in rule) {
		const [dirName, condition] = rule.appendDirectoryName;

		if (condition.fileRootNot) {
			rules.push({
				kind: 'appendDirName',
				condition: {
					kind: 'fileRootNotEqual',
					value: condition.fileRootNot,
				},
				replacement:
					dirName === '@fileRoot'
						? {
								kind: '@fileRoot',
						  }
						: {
								kind: 'value',
								value: dirName,
						  },
			});
		}
	}

	if ('replaceFileRoot' in rule) {
		rules.push({
			kind: 'replaceFileRoot',
			value: rule.replaceFileRoot,
		});
	}

	return rules;
};

const transformPath = (
	parsedPath: ParsedPath,
	rules: ReadonlyArray<Rule>,
): string => {
	const { root, base, dir, ext } = parsedPath;

	let fileRoot = base.slice(0, base.length - ext.length);
	let dirs = dir.split(path.sep);

	rules.forEach((rule) => {
		if (rule.kind === 'replaceDirName') {
			dirs = dirs.map((dirName) => {
				if (dirName !== rule.fromValue) {
					return dirName;
				}

				return rule.toValue;
			});
		}

		if (rule.kind === 'appendDirName') {
			if (
				rule.condition.kind === 'fileRootNotEqual' &&
				rule.condition.value !== fileRoot
			) {
				if (rule.replacement.kind === '@fileRoot') {
					dirs.push(fileRoot);
				}

				if (rule.replacement.kind === 'value') {
					dirs.push(rule.replacement.value);
				}
			}
		}

		if (rule.kind === 'replaceFileRoot') {
			fileRoot = rule.value;
		}
	});

	return path.join(root, ...dirs, `${fileRoot}${ext}`);
};

export const buildDeclarativeTransform = (
	declarativeFilemod: DeclarativeFilemod,
): Transform => {
	if (declarativeFilemod.version !== 1) {
		throw new Error(
			'This filemod engine supports only version 1 of filemods',
		);
	}

	if (!declarativeFilemod.posix) {
		throw new Error(
			'This filemod engine supports only POSIX-compatible operating systems',
		);
	}

	const deleteRules: DeleteRule[] = [];

	if (declarativeFilemod.deleteRules) {
		if ('fileRoot' in declarativeFilemod.deleteRules) {
			declarativeFilemod.deleteRules.fileRoot?.forEach(
				(fileRootValue) => {
					deleteRules.push({
						kind: 'fileRootEqual',
						value: fileRootValue,
					});
				},
			);
		}
	}

	const replaceRules =
		declarativeFilemod.replaceRules?.flatMap((replaceRule) =>
			handleDeclarativeRule(replaceRule),
		) ?? [];

	const copyRules =
		declarativeFilemod.copyRules?.flatMap((copyRule) =>
			handleDeclarativeRule(copyRule),
		) ?? [];

	const pathPlatform = path.posix;

	return async (_, transformApi) => {
		const filePaths = await transformApi.getFilePaths(
			declarativeFilemod.includePattern,
			declarativeFilemod.excludePatterns,
		);

		const commands: Command[] = [];

		filePaths.forEach((filePath) => {
			const parsedPath = pathPlatform.parse(filePath);
			const { base, ext } = parsedPath;

			const fileRoot = base.slice(0, base.length - ext.length);

			const doDelete = deleteRules.some((deleteRule) => {
				if (deleteRule.kind === 'fileRootEqual') {
					return deleteRule.value === fileRoot;
				}

				return false;
			});

			if (doDelete) {
				commands.push({
					kind: 'delete',
					path: filePath,
				});

				return;
			}

			if (replaceRules.length > 0 && copyRules.length > 0) {
				throw new Error(
					'You cannot declare both replace and copy rules',
				);
			}

			if (replaceRules.length > 0) {
				const replacedPath = transformPath(parsedPath, replaceRules);

				if (replacedPath !== filePath) {
					commands.push({
						kind: 'move',
						fromPath: filePath,
						toPath: replacedPath,
					});
				}
			}

			if (copyRules.length > 0) {
				const copyPath = transformPath(parsedPath, copyRules);

				if (copyPath !== filePath) {
					commands.push({
						kind: 'copy',
						fromPath: filePath,
						toPath: copyPath,
					});
				}
			}
		});

		return commands;
	};
};
