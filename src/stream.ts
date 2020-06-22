import {
	cpus
} from 'os';
import Vinyl from 'vinyl';
import through from 'through2-concurrent';
import chalk from 'chalk';
import SrcSetGenerator, {
	IConfig,
	IGenerateConfig,
	Matcher,
	matchImage
} from './';

interface IPluginConfig extends IConfig {
	/**
	 * Print additional info about progress.
	 */
	verbose?: boolean;
}

interface IRule extends IGenerateConfig {
	/**
	 * There is support of 3 types of matchers:
	 * 1. Glob pattern of file path;
	 * 2. Media query to match image by size;
	 * 3. `(path: string, size: ISize, source: Vinyl) => boolean` function.
	 */
	match?: Matcher;
}

const throughOptions = {
	maxConcurrency: cpus().length
};

function toVinyl(source): Vinyl {
	return Vinyl.isVinyl(source)
		? source
		: source.isBuffer && source.isStream && source.isNull
			? new Vinyl(source)
			: source;
}

function log(verbose: boolean, ...message) {

	if (verbose) {
		console.log(...message);
	}
}

export default function plugin(rules: IRule[] = [{}], {
	verbose,
	...inputOptions
}: IPluginConfig = {}) {

	log(
		verbose,
		chalk.blue('\n> Start\n')
	);

	const options = {
		skipOptimization: false,
		scalingUp:        true,
		...inputOptions
	};
	const srcSet = new SrcSetGenerator(options);

	async function each(file, _, next) {

		if (file.isNull() || file.isStream()) {
			next(null, file);
			return;
		}

		const vinylFile = toVinyl(file);

		log(
			verbose,
			`${chalk.blue('> Input:')} ${chalk.yellow(vinylFile.path)}`
		);

		try {

			const results = await Promise.all(
				rules.map(async (rule) => {

					const matches = await matchImage(vinylFile, rule.match);

					if (matches) {

						log(
							verbose,
							`${chalk.blue('> Match:')} ${chalk.yellow(vinylFile.path)}\n\n`,
							rule,
							'\n'
						);

						const images = srcSet.generate(vinylFile, rule);

						for await (const image of images) {
							this.push(image);
							log(
								verbose,
								`${chalk.blue('> Output:')} ${chalk.yellow(`${vinylFile.path} -> ${image.basename}`)}`
							);
						}

						return true;
					}

					return false;
				})
			);

			if (results.every(_ => !_)) {
				log(
					verbose,
					`${chalk.blue('\n> No match:')} ${chalk.yellow(vinylFile.path)}\n`
				);
				next(null, vinylFile);
				return;
			}

			next();
			return;

		} catch (err) {
			next(err);
			return;
		}
	}

	return through.obj(throughOptions, each);
}
