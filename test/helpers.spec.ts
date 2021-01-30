import Vinyl from 'vinyl';
import {
	attachMetadata,
	matchImage
} from '../src/helpers';
import image, {
	expectedSize as imageSize
} from './image';
import icon, {
	expectedSize as iconSize
} from './icon';

describe('Helpers', () => {
	beforeEach(() => {
		Reflect.deleteProperty(image, 'metadata');
	});

	describe('attachMetadata', () => {
		it('should attach correct metadata', async () => {
			await attachMetadata(image);

			expect(image.metadata.width).toBe(imageSize.width);
			expect(image.metadata.height).toBe(imageSize.height);
		});

		it('shouldn\'t reattach metadata', async () => {
			image.metadata = {
				mock: true
			};
			await attachMetadata(image);

			expect(image.metadata.mock).toBe(true);
		});

		it('should reattach metadata', async () => {
			image.metadata = {
				mock: true
			};
			await attachMetadata(image, true);

			expect(image.metadata.width).toBe(imageSize.width);
			expect(image.metadata.height).toBe(imageSize.height);
		});

		it('should attach metadata for SVG', async () => {
			await attachMetadata(icon);

			expect(icon.metadata.width).toBe(iconSize.width);
			expect(icon.metadata.height).toBe(iconSize.height);
		});

		it('should set extname from metadata', async () => {
			const anonImage = new Vinyl({
				contents: image.contents
			});

			expect(anonImage.path).toBeUndefined();

			await attachMetadata(anonImage);

			expect(anonImage.path).toBe('file.jpg');
			expect(anonImage.extname).toBe('.jpg');
			expect(anonImage.metadata.width).toBe(imageSize.width);
			expect(anonImage.metadata.height).toBe(imageSize.height);
		});
	});

	describe('matchImage', () => {
		it('should dismatch unsupported image format', async () => {
			const bmp = image.clone({
				contents: false
			});

			bmp.extname = '.bmp';

			expect(await matchImage(bmp)).toBe(false);
		});

		it('should match by media query', async () => {
			expect(await matchImage(image, `(width: ${imageSize.width}px)`)).toBe(true);
		});

		it('should dismatch by media query', async () => {
			expect(await matchImage(image, '(max-width: 10px)')).toBe(false);
		});

		it('should match by path glob', async () => {
			expect(await matchImage(image, '**/*.jpg')).toBe(true);
		});

		it('should dismatch by path glob', async () => {
			expect(await matchImage(image, '**/*.png')).toBe(false);
		});

		it('should match by function', async () => {
			expect(await matchImage(image, () => true)).toBe(true);
		});

		it('should dismatch by function', async () => {
			expect(await matchImage(image, () => false)).toBe(false);
		});

		it('should match by few matchers', async () => {
			expect(await matchImage(image, ['**/*.jpg', `(width: ${imageSize.width}px)`])).toBe(true);
		});

		it('should dismatch by few matchers', async () => {
			expect(await matchImage(image, ['**/*.png', `(width: ${imageSize.width}px)`])).toBe(false);
		});
	});
});
