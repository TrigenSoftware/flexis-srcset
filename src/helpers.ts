import Vinyl from 'vinyl';
import minimatch from 'minimatch';
import mediaQuery from 'css-mediaquery';
import Sharp from 'sharp';
import ISrsetVinyl from './ISrcsetVinyl';
import {
	isSupportedType
} from './extensions';

export interface ISize {
	width: number;
	height: number;
}

export interface IMatcherFunction {
	(path: string, size: ISize, source: Vinyl): boolean;
}

export type Matcher = string|IMatcherFunction;

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
 * @param  force - Force refetch metadata.
 * @return Source image file with attached metadata.
 */
export async function attachMetadata(source: Vinyl, force = false): Promise<ISrsetVinyl> {

	if (!force && typeof source.metadata === 'object') {
		return source;
	}

	try {
		source.metadata = await Sharp(source.contents as Buffer).metadata();
	} catch (err) {
		return source;
	}

	if (!source.path) {
		source.path = 'file';
	}

	if (!source.extname && source.metadata.format) {
		source.extname = `.${source.metadata.format.replace('jpeg', 'jpg')}`;
	}

	return source;
}

/**
 * Match image file by path and size
 * @param  source - Image file.
 * @param  matcherOrMatchers - Rules to match image file.
 * @return Image is matched or not.
 */
export async function matchImage(source: ISrsetVinyl, matcherOrMatchers: Matcher|Matcher[] = null) {

	if (!isVinylBuffer(source)) {
		throw new Error('Invalid source.');
	}

	await attachMetadata(source);

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
