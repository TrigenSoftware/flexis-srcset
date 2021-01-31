
export type SupportedExtension = 'avif' | 'webp' | 'jpg' | 'png' | 'gif' | 'svg';

export const extensions = {
	avif: /^avif$/i,
	webp: /^webp$/i,
	jpg: /^jpe?g$/i,
	png: /^png$/i,
	gif: /^gif$/i,
	svg: /^svg$/i
};

const patterns = Object.values(extensions);

/**
 * Check image type
 * @param  type - Image extension without dot.
 * @returns Image type is supported or not.
 */
export function isSupportedType(type: string): boolean {
	return patterns.some(_ => _.test(type));
}
