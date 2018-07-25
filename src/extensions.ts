
export const extensions = {
	webp: /^webp$/,
	jpg:  /^jp(e|)g$/,
	png:  /^png$/,
	gif:  /^gif$/,
	svg:  /^svg$/
};

/**
 * Check image type
 * @param  type - Image extension without dot.
 * @return Image type is supported or not.
 */
export function isSupportedType(type: string): boolean {
	return extensions.hasOwnProperty(type);
}
