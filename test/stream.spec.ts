import path from 'path';
import vfs from 'vinyl-fs';
import srcset from '../src/stream';

jest.setTimeout(50000);

describe('stream', () => {

	it('should emit files', (done) => {

		let counter = 0;

		vfs.src(
			path.join(__dirname, 'images/*.{jpg,png,gif,ico}')
		)
			.pipe(srcset([{
				match:  '(min-width: 3000px)',
				width:  [1, 3200, 1920, 1280, 720, 560, 320],
				format: ['jpg', 'webp']
			}]))
			.on('error', done)
			.on('data', () => {
				counter++;
			})
			.on('end', () => {
				expect(counter).toBe(17);
				done();
			});
	});

	it('should match by glob', (done) => {

		let counter = 0;

		vfs.src(
			path.join(__dirname, 'images/*.{jpg,png,gif,ico}')
		)
			.pipe(srcset([{
				match: '**/*.png',
				width: [1, .5]
			}]))
			.on('error', done)
			.on('data', (...args) => {
				counter++;
			})
			.on('end', () => {
				expect(counter).toBe(5);
				done();
			});
	});
});
