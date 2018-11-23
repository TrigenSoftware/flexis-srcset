import Vinyl from 'vinyl';
import minimatch from 'minimatch';
import mediaQuery from 'css-mediaquery';
import Sharp from 'sharp';
import { isSupportedType } from './extensions';

interface ISize {
	width: number;
	height: number;
}

interface IMatcherFunction {
	(path: string, size: ISize, source: Vinyl): boolean;
}

type Matcher = string|IMatcherFunction;

const isMediaQuery = /^\s*(\(\s*((max|min)-|)(width|height)\s*:\s*\d+\w*\s*\)\s*(,|and)\s*)*\(\s*((max|min)-|)(width|height)\s*:\s*\d+\w*\s*\)\s*$/g; // tslint:disable-line

/**
 * Check object is Vinyl-buffer.
 * @param  source - Object to check.
 * @return Result.
 */
export function isVinylBuffer(source: Vinyl) {
	return Vinyl.isVinyl(source) && source.isBuffer() && !source.isNull() && !source.isStream();
}

/**
 * Attach image metadata to the vinyl file.
 * @param  source - Image file.
 * @return Source image file with attached metadata.
 */
export async function attachMetadata(source: Vinyl) {

	if (typeof source.metadata === 'object') {
		return source;
	}

	source.metadata = await Sharp(source.contents as Buffer).metadata();

	return source;
}

/**
 * Match image file by path and size
 * @param  source - Image file.
 * @param  matcherOrMatchers - Rules to match image file.
 * @return Image is matched or not.
 */
export async function matchImage(source: Vinyl, matcherOrMatchers: Matcher|Matcher[] = null) {

	if (!isVinylBuffer(source)) {
		throw new Error('Invalid source.');
	}

	const sourceType = source.extname.replace(/^\./, '');

	if (!isSupportedType(sourceType)) {
		return false;
	}

	if (matcherOrMatchers === null) {
		return true;
	}

	const matchers = Array.isArray(matcherOrMatchers)
		? matcherOrMatchers
		: [matcherOrMatchers];

	await attachMetadata(source);

	const {
		metadata,
		path
	} = source;

	if (typeof metadata !== 'object') {
		return false;
	}

	const size: ISize = {
		width:  metadata.width,
		height: metadata.height
	};

	return matchers.every((funcOrPatternOrMediaQuery) => {

		if (typeof funcOrPatternOrMediaQuery === 'string') {

			if (isMediaQuery.test(funcOrPatternOrMediaQuery)) {
				return mediaQuery.match(funcOrPatternOrMediaQuery, size);
			}

			return minimatch(path, funcOrPatternOrMediaQuery);
		}

		if (typeof funcOrPatternOrMediaQuery === 'function') {
			return funcOrPatternOrMediaQuery(path, size, source);
		}

		return false;
	});
}
