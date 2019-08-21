import Vinyl from 'vinyl';
import mozJpegPlugin from 'imagemin-mozjpeg';
import ISrsetVinyl from '../src/ISrcsetVinyl';
import SrcsetGenerator from '../src';
import image, { expectedSize } from './image';

const optimization = {
	jpg: mozJpegPlugin({
		quality: 80
	})
};

async function vinylsFromAsyncIterator(iterator: AsyncIterableIterator<Vinyl>) {

	const vinyls: ISrsetVinyl[] = [];

	for await (const vinyl of iterator) {
		vinyls.push(vinyl);
	}

	return vinyls;
}

describe('SrcsetGenerator', () => {

	jest.setTimeout(30000);

	it('should create correct instance', () => {

		const srcset = new SrcsetGenerator();

		expect(typeof srcset.generate).toBe('function');
	});

	it('should skip optimization', async () => {

		const srcset = new SrcsetGenerator({
			skipOptimization: true,
			optimization
		});
		const [notOptimizedImage] = await vinylsFromAsyncIterator(srcset.generate(image));

		expect((notOptimizedImage.contents as Buffer).length).toBe(image.contents.length);
	});

	it('should optimize', async () => {

		const srcset = new SrcsetGenerator({
			optimization
		});
		const [optimizedImage] = await vinylsFromAsyncIterator(srcset.generate(image));

		expect((optimizedImage.contents as Buffer).length).toBeLessThan(image.contents.length);
	});

	it('should skip scaling up', async () => {

		const srcset = new SrcsetGenerator({
			skipOptimization: true,
			scalingUp: false
		});
		const images = await vinylsFromAsyncIterator(srcset.generate(image, {
			width: [1, 5000]
		}));

		expect(images.length).toBe(1);
	});

	it('should scaling up', async () => {

		const srcset = new SrcsetGenerator({
			skipOptimization: true
		});
		const images = await vinylsFromAsyncIterator(srcset.generate(image, {
			width: [1, 5000]
		}));

		expect(images.length).toBe(2);
	});

	it('should add default postfix', async () => {

		const srcset = new SrcsetGenerator({
			skipOptimization: true
		});
		const [imageWithPostfix] = await vinylsFromAsyncIterator(srcset.generate(image, {
			width: [320]
		}));

		expect(imageWithPostfix.stem).toBe('image@320w');
		expect(imageWithPostfix.postfix).toBe('@320w');
	});

	it('should add custom postfix', async () => {

		const srcset = new SrcsetGenerator({
			skipOptimization: true,
			postfix: '@postfix'
		});
		const [imageWithPostfix] = await vinylsFromAsyncIterator(srcset.generate(image));

		expect(imageWithPostfix.stem).toBe('image@postfix');
		expect(imageWithPostfix.postfix).toBe('@postfix');
	});

	describe('#generate', () => {

		const srcset = new SrcsetGenerator({
			skipOptimization: true
		});

		it('should throw error if format is not supported', async () => {

			const bmp = image.clone({ contents: false });

			bmp.extname = '.bmp';

			expect(
				vinylsFromAsyncIterator(srcset.generate(bmp))
			).rejects.toThrow();
		});

		it('should skip optimization', async () => {

			const srcset = new SrcsetGenerator({
				optimization
			});
			const [notOptimizedImage] = await vinylsFromAsyncIterator(srcset.generate(image, {
				skipOptimization: true
			}));

			expect((notOptimizedImage.contents as Buffer).length).toBe(image.contents.length);
		});

		it('should skip scaling up', async () => {

			const images = await vinylsFromAsyncIterator(srcset.generate(image, {
				scalingUp: false,
				width: [1, 5000]
			}));

			expect(images.length).toBe(1);
		});

		it('shouldn\'t generate any file, due to file format', async () => {

			const gif = image.clone({ contents: false });

			gif.extname = '.gif';

			const images = await vinylsFromAsyncIterator(srcset.generate(gif, {
				format: ['jpg', 'webp']
			}));

			expect(images.length).toBe(0);
		});

		it('should generate single file, due to file format', async () => {

			const gif = image.clone({ contents: false });

			gif.extname = '.gif';

			const images = await vinylsFromAsyncIterator(srcset.generate(gif, {
				format: ['jpg', 'webp', 'gif']
			}));

			expect(images.length).toBe(1);
		});

		it('should add custom postfix', async () => {

			const [imageWithPostfix] = await vinylsFromAsyncIterator(srcset.generate(image, {
				postfix: '@postfix'
			}));

			expect(imageWithPostfix.stem).toBe('image@postfix');
			expect(imageWithPostfix.postfix).toBe('@postfix');
		});

		it('should generate desired widths', async () => {

			const images = await vinylsFromAsyncIterator(srcset.generate(image, {
				width: [1, 1280, 320]
			}));

			expect(images.length).toBe(3);
			expect(images[0].metadata.width).toBe(expectedSize.width);
			expect(images[1].metadata.width).toBe(1280);
			expect(images[2].metadata.width).toBe(320);
		});

		it('should generate desired scaled widths', async () => {

			const images = await vinylsFromAsyncIterator(srcset.generate(image, {
				width: [0.33, 0.66, 1]
			}));

			expect(images.length).toBe(3);
			expect(images[2].metadata.width).toBe(expectedSize.width);
			expect(images[1].metadata.width).toBe(2060);
			expect(images[0].metadata.width).toBe(1030);
		});

		it('should generate desired formats', async () => {

			const images = await vinylsFromAsyncIterator(srcset.generate(image, {
				format: ['jpg', 'webp', 'png']
			}));

			expect(images.length).toBe(3);
			expect(images[0].extname).toBe('.jpg');
			expect(images[1].extname).toBe('.webp');
			expect(images[2].extname).toBe('.png');
		});

		it('should throw error if desired format is not supported', async () => {

			expect(
				vinylsFromAsyncIterator(srcset.generate(image, {
					format: 'bmp'
				} as any))
			).rejects.toThrow();
		});
	});
});
