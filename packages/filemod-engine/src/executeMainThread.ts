import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { handleCliArguments } from './worker';

export const executeMainThread = async () => {
	yargs(hideBin(process.argv))
		.command(
			'transform [transformFilePath] [rootDirectoryPath]',
			'transforms a directory using a transform file',
			(y) => {
				return y
					.positional('transformFilePath', {
						type: 'string',
						array: false,
						demandOption: true,
					})
					.positional('rootDirectoryPath', {
						type: 'string',
						array: false,
						demandOption: true,
					})
					.option('dryRun', {
						alias: 'd',
						describe: 'Whether to execute commands or not',
						array: false,
						type: 'boolean',
						default: false,
					});
			},
			async ({ transformFilePath, rootDirectoryPath, dryRun }) =>
				handleCliArguments(
					transformFilePath,
					rootDirectoryPath,
					dryRun,
				),
		)
		.help()
		.scriptName('filemod-engine')
		.alias('help', 'h')
		.parse();
};
