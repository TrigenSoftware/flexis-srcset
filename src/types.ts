import {
	SupportedExtension
} from './extensions';

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
	webp: Record<string, any>;
	jpg: Record<string, any>;
	png: Record<string, any>;
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
 */
export interface IOptimizationConfig {
	webp: any;
	jpg: any;
	png: any;
	gif: any;
	svg: any;
}

export interface IPostfixFormatter {
	(width: number, mul?: number, format?: string): string;
}

export type Postfix = string|IPostfixFormatter;

export interface IConfig {
	processing?: Partial<IProcessingConfig>;
	optimization?: Partial<IOptimizationConfig>;
	skipOptimization?: boolean;
	scalingUp?: boolean;
	postfix?: Postfix;
}

export interface IGenerateConfig extends IConfig {
	format?: SupportedExtension|SupportedExtension[];
	width?: number|number[];
}
