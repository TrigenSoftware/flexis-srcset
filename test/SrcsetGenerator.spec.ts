import Vinyl from 'vinyl';
import mozJpegPlugin from 'imagemin-mozjpeg';
import SrcSetGenerator, {
	ISrcSetVinyl
} from '../src';
import image, {
	expectedSize
} from './image';
import icon from './icon';

const optimization = {
	jpg: mozJpegPlugin({
		quality: 80
	})
};

async function vinylsFromAsyncIterator(iterator: AsyncIterableIterator<Vinyl>) {
	const vinyls: ISrcSetVinyl[] = [];

	for await (const vinyl of iterator) {
		vinyls.push(vinyl);
	}

	return vinyls;
}

describe('SrcSetGenerator', () => {
	jest.setTimeout(60000);

	it('should create correct instance', () => {
		const srcSet = new SrcSetGenerator();

		expect(typeof srcSet.generate).toBe('function');
	});

	it('should skip optimization', async () => {
		const srcSet = new SrcSetGenerator({
			skipOptimization: true,
			optimization
		});
		const [notOptimizedImage] = await vinylsFromAsyncIterator(srcSet.generate(image));

		expect((notOptimizedImage.contents as Buffer).length).toBe(image.contents.length);
	});

	it('should optimize', async () => {
		const srcSet = new SrcSetGenerator({
			optimization
		});
		const [optimizedImage] = await vinylsFromAsyncIterator(srcSet.generate(image));

		expect((optimizedImage.contents as Buffer).length).toBeLessThan(image.contents.length);
	});

	it('should skip scaling up', async () => {
		const srcSet = new SrcSetGenerator({
			skipOptimization: true,
			scalingUp: false
		});
		const images = await vinylsFromAsyncIterator(srcSet.generate(image, {
			width: [1, 5000]
		}));

		expect(images.length).toBe(1);
	});

	it('should scaling up', async () => {
		const srcSet = new SrcSetGenerator({
			skipOptimization: true
		});
		const images = await vinylsFromAsyncIterator(srcSet.generate(image, {
			width: [1, 5000]
		}));

		expect(images.length).toBe(2);
	});

	it('should add default postfix', async () => {
		const srcSet = new SrcSetGenerator({
			skipOptimization: true
		});
		const [imageWithPostfix] = await vinylsFromAsyncIterator(srcSet.generate(image, {
			width: [320]
		}));

		expect(imageWithPostfix.stem).toBe('image@320w');
		expect(imageWithPostfix.postfix).toBe('@320w');
	});

	it('should add custom postfix', async () => {
		const srcSet = new SrcSetGenerator({
			skipOptimization: true,
			postfix: '@postfix'
		});
		const [imageWithPostfix] = await vinylsFromAsyncIterator(srcSet.generate(image));

		expect(imageWithPostfix.stem).toBe('image@postfix');
		expect(imageWithPostfix.postfix).toBe('@postfix');
	});

	it('should support avif', async () => {
		const srcSet = new SrcSetGenerator({
			skipOptimization: true
		});
		const [avifImage] = await vinylsFromAsyncIterator(srcSet.generate(image, {
			format: 'avif'
		}));

		expect(avifImage.metadata.format).toBe('heif');
		expect(avifImage.extname).toBe('.avif');
	});

	it('should work in single thread', async () => {
		const srcSet = new SrcSetGenerator({
			skipOptimization: true,
			concurrency: 1
		});
		const images = await vinylsFromAsyncIterator(srcSet.generate(image, {
			width: [60, 120, 320]
		}));

		expect(images.length).toBe(3);
	});

	describe('#generate', () => {
		const srcSet = new SrcSetGenerator({
			skipOptimization: true
		});

		it('should throw error if format is not supported', async () => {
			const bmp = image.clone({
				contents: false
			});

			bmp.extname = '.bmp';

			await expect(
				vinylsFromAsyncIterator(srcSet.generate(bmp))
			).rejects.toThrow();
		});

		it('should skip optimization', async () => {
			const srcSet = new SrcSetGenerator({
				optimization
			});
			const [notOptimizedImage] = await vinylsFromAsyncIterator(srcSet.generate(image, {
				skipOptimization: true
			}));

			expect((notOptimizedImage.contents as Buffer).length).toBe(image.contents.length);
		});

		it('should skip scaling up', async () => {
			const images = await vinylsFromAsyncIterator(srcSet.generate(image, {
				scalingUp: false,
				width: [1, 5000]
			}));

			expect(images.length).toBe(1);
		});

		it('shouldn\'t generate any file, due to file format', async () => {
			const gif = image.clone({
				contents: false
			});

			gif.extname = '.gif';

			const images = await vinylsFromAsyncIterator(srcSet.generate(gif, {
				format: ['jpg', 'webp']
			}));

			expect(images.length).toBe(0);
		});

		it('should generate single file, due to file format', async () => {
			const gif = image.clone({
				contents: false
			});

			gif.extname = '.gif';

			const images = await vinylsFromAsyncIterator(srcSet.generate(gif, {
				format: ['jpg', 'webp', 'gif']
			}));

			expect(images.length).toBe(1);
		});

		it('should add custom postfix', async () => {
			const [imageWithPostfix] = await vinylsFromAsyncIterator(srcSet.generate(image, {
				postfix: '@postfix'
			}));

			expect(imageWithPostfix.stem).toBe('image@postfix');
			expect(imageWithPostfix.postfix).toBe('@postfix');
		});

		it('should generate desired widths', async () => {
			const images = await vinylsFromAsyncIterator(srcSet.generate(image, {
				width: [1, 1280, 320]
			}));

			expect(images.length).toBe(3);
			expect(images[0].metadata.width).toBe(expectedSize.width);
			expect(images[1].metadata.width).toBe(1280);
			expect(images[2].metadata.width).toBe(320);
		});

		it('should generate desired scaled widths', async () => {
			const images = await vinylsFromAsyncIterator(srcSet.generate(image, {
				width: [0.33, 0.66, 1]
			}));

			expect(images.length).toBe(3);
			expect(images[2].metadata.width).toBe(expectedSize.width);
			expect(images[1].metadata.width).toBe(2060);
			expect(images[0].metadata.width).toBe(1030);
		});

		it('should generate desired formats', async () => {
			const images = await vinylsFromAsyncIterator(srcSet.generate(image, {
				format: ['jpg', 'webp', 'png']
			}));

			expect(images.length).toBe(3);
			expect(images[0].extname).toBe('.jpg');
			expect(images[1].extname).toBe('.webp');
			expect(images[2].extname).toBe('.png');
		});

		it('should generate desired formats with sizes', async () => {
			const images = await vinylsFromAsyncIterator(srcSet.generate(image, {
				format: ['jpg', 'webp', 'png'],
				width: [0.33, 0.66, 1],
				skipOptimization: true
			}));

			expect(images.length).toBe(9);
		});

		it('should no emit images', async () => {
			const images = await vinylsFromAsyncIterator(srcSet.generate(icon, {
				format: ['jpg', 'webp', 'png'],
				width: [0.33, 0.66, 1],
				skipOptimization: true
			}));

			expect(images.length).toBe(0);
		});

		it('should skip sizes', async () => {
			const images = await vinylsFromAsyncIterator(srcSet.generate(icon, {
				format: ['svg'],
				width: [0.33, 0.66, 1],
				skipOptimization: true
			}));

			expect(images.length).toBe(1);
		});

		it('should throw error if desired format is not supported', async () => {
			await expect(
				vinylsFromAsyncIterator(srcSet.generate(image, {
					format: 'bmp'
				} as any))
			).rejects.toThrow();
		});

		it('should add originMultiplier to metadate', async () => {
			const [
				w64,
				x2,
				x1,
				w320
			] = await vinylsFromAsyncIterator(srcSet.generate(image, {
				scalingUp: false,
				width: [64, 1, .5, 320]
			}));

			expect(w64.metadata.originMultiplier).toBeFalsy();
			expect(x2.metadata.originMultiplier).toBe(1);
			expect(x1.metadata.originMultiplier).toBe(.5);
			expect(w320.metadata.originMultiplier).toBeFalsy();
		});
	});
});
