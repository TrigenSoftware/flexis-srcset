import Vinyl from 'vinyl';
import Sharp from 'sharp';
import Imagemin from 'imagemin';
import {
	processing as defaultProcessing,
	optimization as defaultOptimization,
	postfix as defaultPostfix
} from './defaults';
import {
	extensions,
	typeIsSupported
} from './extensions';
import {
	attachMetadata,
	matchImage
} from './helpers';

export {
	typeIsSupported,
	matchImage
};

interface IProcessingConfig {
	webp: Record<string, any>;
	jpg: Record<string, any>;
	png: Record<string, any>;
}

interface IOptimizationConfig {
	webp: any;
	jpg: any;
	png: any;
	gif: any;
	svg: any;
}

interface IPostfixFormatter {
	(width: number, mul: number): string;
}

interface IConfig {
	processing?: Partial<IProcessingConfig>;
	optimization?: Partial<IOptimizationConfig>;
	skipOptimization?: boolean;
	scalingUp?: boolean;
	postfix?: IPostfixFormatter;
}

interface IGenerateConfig extends IConfig {
	format?: string[];
	width?: number[];
}

export default class SrcsetGenerator {

	private readonly processing: IProcessingConfig = defaultProcessing;
	private readonly optimization: IOptimizationConfig = defaultOptimization;
	private readonly skipOptimization: boolean = false;
	private readonly scalingUp: boolean = true;
	private readonly postfix: IPostfixFormatter = defaultPostfix;

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

			if (typeof postfix === 'function') {
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
	 * @param  source - Image file.
	 * @param  generateConfig - Image handle config.
	 * @return Results of handling.
	 */
	async *generate(source: Vinyl, generateConfig: IGenerateConfig = {}) {

		if (!Vinyl.isVinyl(source) || source.isNull() || source.isStream()) {
			throw new Error('Invalid source.');
		}

		const config: IGenerateConfig = {
			format:           [],
			width:            [],
			postfix:          null,
			processing:       null,
			optimization:     null,
			skipOptimization: this.skipOptimization,
			scalingUp:        this.scalingUp,
			...generateConfig
		};

		const sourceType = source.extname.replace(/^\./, '');

		if (!typeIsSupported(sourceType)) {
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

			if (!typeIsSupported(type)) {
				throw new Error(`"${type}" is not supported.`);
			}

			if (onlyOptimize) {

				if (skipOptimization) {
					yield source;
					continue;
				}

				yield await this.optimizeImage(source, config);
				continue;
			}

			for (const width of widths) {

				if (typeof width !== 'number') {
					throw new Error('Invalid width parameter.');
				}

				let image = await attachMetadata(source);

				if (!scalingUp && image.metadata.width < width) {
					continue;
				}

				image = await this.processImage(image, type, width, config);

				if (!skipOptimization) {
					image = await this.optimizeImage(image, config);
				}

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
	 * @return Destination image file.
	 */
	private async processImage(
		source: Vinyl,
		outputType: string,
		width: number = null,
		config: IConfig = {}
	) {

		const { metadata } = source;
		const originWidth: number = typeof metadata === 'object' ? metadata.width : 0;
		const processing: IProcessingConfig = {
			...this.processing,
			...config.processing
		};
		const target = source.clone({ contents: false });
		const processor = Sharp(source.contents as Buffer);

		target.extname = `.${outputType}`;

		if (width !== null) {

			const calculatedWidth = originWidth && width <= 1
				? width * originWidth
				: width;

			this.addPostfix(target, calculatedWidth, width, config.postfix);

			if (calculatedWidth < originWidth) {
				processor.resize(calculatedWidth);
			}

		} else {
			this.addPostfix(target, originWidth, originWidth, config.postfix);
		}

		if (width === 1 && source.extname === target.extname) {
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
	 * @return Destination image file.
	 */
	private async optimizeImage(source: Vinyl, config: IConfig = {}) {

		const target = source.clone({ contents: false });
		const optimization: IOptimizationConfig = {
			...this.optimization,
			...config.optimization
		};

		target.contents = await Imagemin.buffer(source.contents as Buffer, {
			plugins: [optimization[source.extname.replace(/^\./, '')]]
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
		target: Vinyl,
		calculatedWidth: number,
		width: number,
		customPostfix: string|IPostfixFormatter = null
	) {

		const { postfix } = this;

		if (typeof customPostfix === 'string') {
			target.stem += customPostfix;
		} else
		if (typeof customPostfix === 'function') {
			target.stem += customPostfix(calculatedWidth, width);
		} else
		if (typeof postfix === 'function') {
			target.stem += postfix(calculatedWidth, width);
		}
	}
}
