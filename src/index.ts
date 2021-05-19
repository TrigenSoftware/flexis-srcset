import {
	cpus
} from 'os';
import Vinyl from 'vinyl';
import Sharp from 'sharp';
import Imagemin from 'imagemin';
import pLimit, {
	Limit
} from 'p-limit';
import {
	processing as defaultProcessing,
	optimization as defaultOptimization,
	postfix as defaultPostfix
} from './defaults';
import {
	SupportedExtension,
	extensions,
	isSupportedType
} from './extensions';
import {
	cuncurrentIterator,
	combineVariants,
	isVinylBuffer,
	cloneSrcSetVinyl,
	attachMetadata,
	getFormat
} from './helpers';
import {
	ISrcSetVinyl,
	IProcessingConfig,
	IOptimizationConfig,
	Postfix,
	IConfig,
	IGenerateConfig
} from './types';

export * from './extensions';
export * from './helpers';
export * from './types';

export default class SrcSetGenerator {
	private readonly processing: IProcessingConfig = defaultProcessing;
	private readonly optimization: IOptimizationConfig = defaultOptimization;
	private readonly skipOptimization: boolean = false;
	private readonly scalingUp: boolean = true;
	private readonly postfix: Postfix = defaultPostfix;
	private readonly limit: Limit = null;

	constructor(config: IConfig = {}) {
		if (typeof config === 'object') {
			const {
				processing,
				optimization,
				postfix,
				skipOptimization,
				scalingUp,
				concurrency,
				limit
			} = config;

			Object.assign(this.processing, processing);
			Object.assign(this.optimization, optimization);

			if (typeof postfix === 'function' || typeof postfix === 'string') {
				this.postfix = postfix;
			}

			if (typeof skipOptimization === 'boolean') {
				this.skipOptimization = skipOptimization;
			}

			if (typeof scalingUp === 'boolean') {
				this.scalingUp = scalingUp;
			}

			this.limit = typeof limit === 'function'
				? limit
				: pLimit(concurrency || cpus().length);
		}
	}

	/**
	 * Create set of sources form original image.
	 * @param source - Image file.
	 * @param generateConfig - Image handle config.
	 * @yields Results of handling.
	 */
	async *generate(source: ISrcSetVinyl, generateConfig: IGenerateConfig = {}) {
		if (!isVinylBuffer(source)) {
			throw new Error('Invalid source.');
		}

		await attachMetadata(source);

		const {
			limit
		} = this;
		const self = this;
		const config: IGenerateConfig = {
			format: [],
			width: [],
			postfix: null,
			processing: null,
			optimization: null,
			skipOptimization: this.skipOptimization,
			scalingUp: this.scalingUp,
			...generateConfig
		};
		const sourceType = getFormat(source);

		if (!isSupportedType(sourceType)) {
			throw new Error(`"${sourceType}" is not supported.`);
		}

		const outputTypes = (
			Array.isArray(config.format)
				? config.format
				: [config.format]
		).map(_ => _.toLowerCase() as SupportedExtension);
		const widths = Array.isArray(config.width)
			? config.width
			: [config.width];

		if (!outputTypes.length) {
			outputTypes.push(sourceType);
		}

		if (!widths.length) {
			widths.push(1);
		}

		const {
			skipOptimization,
			scalingUp
		} = config;
		const onlyOptimize = extensions.svg.test(sourceType)
			|| extensions.gif.test(sourceType);
		const variants = combineVariants({
			type: outputTypes,
			width: widths
		});

		yield *cuncurrentIterator(variants, async function *g({
			type,
			width
		}) {
			if (!isSupportedType(type)) {
				throw new Error(`"${type}" is not supported.`);
			}

			if (onlyOptimize) {
				if (type !== sourceType) {
					return;
				}

				if (skipOptimization) {
					yield source;
					return;
				}

				const optimizedImage: ISrcSetVinyl = await self.optimizeImage(source, config);

				await attachMetadata(optimizedImage, true);

				yield optimizedImage;
				return;
			}

			if (typeof width !== 'number') {
				throw new Error('Invalid width parameter.');
			}

			if (!scalingUp && source.metadata.width < width) {
				return;
			}

			let image = await self.processImage(source, type, width, config);

			if (!skipOptimization) {
				image = await self.optimizeImage(image, config);
			}

			await attachMetadata(image, true);

			yield image;
		}, limit);
	}

	/**
	 * Resize and convert image.
	 * @param source - Image file.
	 * @param outputType - Destination image file format.
	 * @param width - Aspect ratio multiplier for destination image.
	 * @param config - Image handle config.
	 * @returns Destination image file.
	 */
	private async processImage(
		source: ISrcSetVinyl,
		outputType: string,
		width: number = null,
		config: IConfig = {}
	) {
		const {
			metadata
		} = source;
		const originWidth: number = typeof metadata === 'object' ? metadata.width : 0;
		const processing: IProcessingConfig = {
			...this.processing,
			...config.processing
		};
		const target = cloneSrcSetVinyl(source);
		const processor = Sharp(source.contents as Buffer);
		let willResize = false;

		target.extname = `.${outputType}`;

		if (target.metadata) {
			Reflect.deleteProperty(target.metadata, 'originMultiplier');
		}

		if (width !== null) {
			const isMultiplier = width <= 1;
			const calculatedWidth = originWidth && isMultiplier
				? Math.ceil(width * originWidth)
				: width;

			if (isMultiplier) {
				target.metadata.originMultiplier = width;
			}

			this.addPostfix(target, calculatedWidth, width, config.postfix);

			if (calculatedWidth < originWidth) {
				processor.resize(calculatedWidth);
				willResize = true;
			}
		} else {
			this.addPostfix(target, originWidth, originWidth, config.postfix);
		}

		if (!willResize && source.extname.toLowerCase() === target.extname) {
			target.contents = source.contents;
			return target;
		}

		switch (true) {
			case extensions.webp.test(outputType):
				processor.webp(processing.webp);
				break;

			case extensions.jpg.test(outputType):
				processor.jpeg(processing.jpg);
				break;

			case extensions.png.test(outputType):
				processor.png(processing.png);
				break;

			case extensions.avif.test(outputType):
				processor.avif(processing.avif);
				break;

			default:
		}

		target.contents = await processor.toBuffer();

		return target;
	}

	/**
	 * Optimize image with imagemin.
	 * @param source - Image file.
	 * @param config - Image handle config.
	 * @returns Destination image file.
	 */
	private async optimizeImage(source: Vinyl, config: IConfig = {}) {
		const target = cloneSrcSetVinyl(source);
		const optimization: IOptimizationConfig = {
			...this.optimization,
			...config.optimization
		};
		const maybePlugins = optimization[getFormat(source)];
		const plugins = (
			Array.isArray(maybePlugins)
				? maybePlugins
				: [maybePlugins]
		).filter(Boolean);

		if (plugins.length) {
			target.contents = await Imagemin.buffer(source.contents as Buffer, {
				plugins
			});
		}

		return target;
	}

	/**
	 * Add postfix to image file name.
	 * @param target - mage file to add postfix.
	 * @param calculatedWidth - Calculated width of image.
	 * @param width - Aspect ratio multiplier of image.
	 * @param customPostfix - Custom postfix generator.
	 */
	private addPostfix(
		target: ISrcSetVinyl,
		calculatedWidth: number,
		width: number,
		customPostfix: Postfix = null
	) {
		const format = getFormat(target);
		const {
			postfix
		} = this;
		let calculatedPostfix = '';

		if (typeof customPostfix === 'string') {
			calculatedPostfix = customPostfix;
		} else
		if (typeof customPostfix === 'function') {
			calculatedPostfix = customPostfix(calculatedWidth, width, format);
		} else
		if (typeof postfix === 'string') {
			calculatedPostfix = postfix;
		} else
		if (typeof postfix === 'function') {
			calculatedPostfix = postfix(calculatedWidth, width, format);
		}

		if (typeof calculatedPostfix === 'string') {
			target.postfix = calculatedPostfix;
			target.stem += calculatedPostfix;
		}
	}
}
