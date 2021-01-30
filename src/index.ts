import Vinyl from 'vinyl';
import Sharp from 'sharp';
import Imagemin from 'imagemin';
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
	isVinylBuffer,
	attachMetadata
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

	constructor(config: IConfig = {}) {
		if (typeof config === 'object') {
			const {
				processing,
				optimization,
				postfix,
				skipOptimization,
				scalingUp
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
		const sourceType = source.extname.replace(/^\./, '') as SupportedExtension;

		if (!isSupportedType(sourceType)) {
			throw new Error(`"${sourceType}" is not supported.`);
		}

		const outputTypes = Array.isArray(config.format)
			? config.format
			: [config.format];
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

		for (const type of outputTypes) {
			if (!isSupportedType(type)) {
				throw new Error(`"${type}" is not supported.`);
			}

			if (onlyOptimize) {
				if (type !== sourceType) {
					continue;
				}

				if (skipOptimization) {
					yield source;
					continue;
				}

				const optimizedImage: ISrcSetVinyl = await this.optimizeImage(source, config);

				await attachMetadata(optimizedImage, true);

				yield optimizedImage;
				continue;
			}

			for (const width of widths) {
				if (typeof width !== 'number') {
					throw new Error('Invalid width parameter.');
				}

				if (!scalingUp && source.metadata.width < width) {
					continue;
				}

				let image = await this.processImage(source, type, width, config);

				if (!skipOptimization) {
					image = await this.optimizeImage(image, config);
				}

				await attachMetadata(image, true);

				yield image;
			}
		}
	}

	/**
	 * Resize and convert image.
	 * @param  source - Image file.
	 * @param  outputType - Destination image file format.
	 * @param  width - Aspect ratio multiplier for destination image.
	 * @param  config - Image handle config.
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
		const target = source.clone({
			contents: false
		});
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

		if (!willResize && source.extname === target.extname) {
			target.contents = source.contents;
			return target;
		}

		if (extensions.webp.test(outputType)) {
			processor.webp(processing.webp);
		} else
		if (extensions.jpg.test(outputType)) {
			processor.jpeg(processing.jpg);
		} else
		if (extensions.png.test(outputType)) {
			processor.png(processing.png);
		}

		target.contents = await processor.toBuffer();

		return target;
	}

	/**
	 * Optimize image with imagemin.
	 * @param  source - Image file.
	 * @param  config - Image handle config.
	 * @returns Destination image file.
	 */
	private async optimizeImage(source: Vinyl, config: IConfig = {}) {
		const target = source.clone({
			contents: false
		});
		const optimization: IOptimizationConfig = {
			...this.optimization,
			...config.optimization
		};
		const plugins = optimization[source.extname.replace(/^\./, '') as SupportedExtension];

		target.contents = await Imagemin.buffer(source.contents as Buffer, {
			plugins: Array.isArray(plugins)
				? plugins
				: [plugins]
		});

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
		const format = target.extname.replace('.', '');
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
