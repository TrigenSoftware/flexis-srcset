import {
	argv,
	end,
	options as readOptions
} from 'argue-cli';
import Table from 'easy-table';
import vfs from 'vinyl-fs';
import getRc from 'rcfile';
import omit from 'omit-empty';
import stream from './stream';

const {
	help,
	verbose,
	match,
	width,
	format,
	skipOptimization,
	noScalingUp,
	dest
}: any = readOptions([
	['help', 'h'],
	['verbose', 'v'],
	['headers', 'H']
], [
	['match', 'm'],
	['width', 'w'],
	['format', 'f'],
	{ 'postfix': 'p' },
	{ 'dest': 'd' },
	'skipOptimization',
	'noScalingUp'
]);

if (help) {

	end();

	const optionsTable = new Table();

	optionsTable.cell('Option', 'sources');
	optionsTable.cell('Description', 'Source image(s) glob patterns.');
	optionsTable.newRow();

	optionsTable.cell('Option', '--help, -h');
	optionsTable.cell('Description', 'Print this message.');
	optionsTable.newRow();

	optionsTable.cell('Option', '--verbose, -v');
	optionsTable.cell('Description', 'Print additional info about progress.');
	optionsTable.newRow();

	optionsTable.cell('Option', '--match, -m');
	optionsTable.cell('Description', 'Glob patern(s) or media query(ies) to match image(s) by name or size.');
	optionsTable.cell('Default', 'all images');
	optionsTable.newRow();

	optionsTable.cell('Option', '--width, -w');
	optionsTable.cell(
		'Description',
		'Output image(s) widths to resize, value less than or equal to 1 will be detected as multiplier.'
	);
	optionsTable.cell('Default', 'no resize');
	optionsTable.newRow();

	optionsTable.cell('Option', '--format, -f');
	optionsTable.cell('Description', 'Output image(s) formats to convert.');
	optionsTable.cell('Default', 'no convert');
	optionsTable.newRow();

	optionsTable.cell('Option', '--skipOptimization');
	optionsTable.cell('Description', 'Do not optimize output images.');
	optionsTable.cell('Default', 'false');
	optionsTable.newRow();

	optionsTable.cell('Option', '--noScalingUp');
	optionsTable.cell('Description', 'Do not generate images with higher resolution than they\'s sources are.');
	optionsTable.cell('Default', 'false');
	optionsTable.newRow();

	optionsTable.cell('Option', '--dest, -d');
	optionsTable.cell('Description', 'Destination directory.');
	optionsTable.newRow();

	console.log(`\nsrcset [...sources] [...options]\n\n${optionsTable.toString()}`);
	process.exit(0);
}

const rc = getRc('srcset');
const rule = match || width || format ? omit({
	match,
	width: width && width.map(Number),
	format
}) : null;
const rules = rule
	? [rule]
	: rc.rules || [{}];
const params = {
	...rc,
	...omit({
		src:       argv.length
			? argv
			: rc.src,
		scalingUp: typeof noScalingUp === 'undefined'
			? rc.scalingUp
			: !noScalingUp,
		skipOptimization,
		verbose,
		dest
	})
};

if (!params.src || !params.src.length) {
	throw new Error('No any sources');
}

vfs.src(params.src)
	.pipe(stream(rules, params))
	.pipe(vfs.dest(params.dest));
