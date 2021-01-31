import Vinyl from 'vinyl';
import {
	Metadata
} from 'sharp';
import {
	Plugin
} from 'imagemin';
import {
	SupportedExtension
} from './extensions';

export interface ISrcSetVinyl extends Vinyl {
	metadata?: Metadata & {
		originMultiplier?: number;
	};
	postfix?: string;
}

/**
 * Object with [Sharp configs](http://sharp.readthedocs.io/en/stable/api-output/) for each supported format.
 *
 * Example:
 * ```js
 * {
 *     webp: {
 *         quality: 100
 *     },
 *     jpg: {
 *         quality: 100
 *     },
 *     png: {}
 * }
 * ```
 */
export interface IProcessingConfig {
	avif: Record<string, unknown>;
	webp: Record<string, unknown>;
	jpg: Record<string, unknown>;
	png: Record<string, unknown>;
}

/**
 * Object with [imagemin](https://www.npmjs.com/package/imagemin) plugins for each format.
 *
 * Example:
 * ```js
 * {
 *     webp: webpPlugin({
 *         quality: 100
 *     }),
 *     jpg:  mozJpegPlugin({
 *         quality: 100
 *     }),
 *     png:  zopfliPlugin(),
 *     gif:  gifLossyPlugin(),
 *     svg:  svgoPlugin()
 * }
 * ```
 */
export interface IOptimizationConfig {
	avif: Plugin | Plugin[];
	webp: Plugin | Plugin[];
	jpg: Plugin | Plugin[];
	png: Plugin | Plugin[];
	gif: Plugin | Plugin[];
	svg: Plugin | Plugin[];
}

export type IPostfixFormatter = (width: number, mul?: number, format?: string) => string;

/**
 * Postfix string or function to generate postfix for image.
 */
export type Postfix = string|IPostfixFormatter;

export interface IConfig {
	/**
	 * Object with Sharp configs for each supported format.
	 */
	processing?: Partial<IProcessingConfig>;
	/**
	 * Object with imagemin plugins for each format.
	 */
	optimization?: Partial<IOptimizationConfig>;
	/**
	 * Do not optimize output images.
	 */
	skipOptimization?: boolean;
	/**
	 * Generate images with higher resolution than they's sources are.
	 */
	scalingUp?: boolean;
	/**
	 * Postfix string or function to generate postfix for image.
	 */
	postfix?: Postfix;
}

export interface IGenerateConfig extends IConfig {
	/**
	 * Output image(s) formats to convert.
	 */
	format?: SupportedExtension|SupportedExtension[];
	/**
	 * Output image(s) widths to resize, value less than or equal to 1 will be detected as multiplier.
	 */
	width?: number|number[];
}
