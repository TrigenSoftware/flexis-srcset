/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import Vinyl from 'vinyl';
import minimatch from 'minimatch';
import mediaQuery from 'css-mediaquery';
import Sharp from 'sharp';
import {
	ISrcSetVinyl
} from '../types';
import {
	SupportedExtension,
	isSupportedType
} from '../extensions';

export interface ISize {
	width: number;
	height: number;
}

export type IMatcherFunction = (path: string, size: ISize, source: Vinyl) => boolean;

/**
 * There is support of 3 types of matchers:
 * 1. Glob pattern of file path;
 * 2. Media query to match image by size;
 * 3. `(path: string, size: ISize, source: Vinyl) => boolean` function.
 */
export type Matcher = string|IMatcherFunction;

const isMediaQuery = /\(\s*([^\s:)]+)\s*(?::\s*([^\s)]+))?\s*\)/;

/**
 * Check object is Vinyl-buffer.
 * @param source - Object to check.
 * @returns Result.
 */
export function isVinylBuffer(source: Vinyl) {
	return Vinyl.isVinyl(source) && source.isBuffer() && !source.isNull() && !source.isStream();
}

/**
 * Clone Vinyl object with metadata.
 * @param source - Vinyl object to clone.
 * @returns Vinyl object clone.
 */
export function cloneSrcSetVinyl(source: ISrcSetVinyl) {
	const vinylClone = source.clone({
		contents: false
	});

	if (source.metadata) {
		vinylClone.metadata = {
			...source.metadata
		};
	}

	return vinylClone;
}

/**
 * Attach image metadata to the vinyl file.
 * @param source - Image file.
 * @param force - Force refetch metadata.
 * @returns Source image file with attached metadata.
 */
export async function attachMetadata(source: Vinyl, force = false): Promise<ISrcSetVinyl> {
	if (!force && typeof source.metadata === 'object') {
		return source;
	}

	try {
		const metadata = await Sharp(source.contents as Buffer).metadata();
		const originMultiplier = source?.metadata?.originMultiplier;

		source.metadata = metadata;
		source.metadata.originMultiplier = originMultiplier;
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
 * @param source - Image file.
 * @param matcherOrMatchers - Rules to match image file.
 * @returns Image is matched or not.
 */
export async function matchImage(source: ISrcSetVinyl, matcherOrMatchers: Matcher|Matcher[] = null) {
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
		width: metadata.width,
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

export function getFormat(file: Vinyl) {
	return file.extname.replace(/^\./, '').toLowerCase() as SupportedExtension;
}
