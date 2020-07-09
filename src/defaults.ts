import webpPlugin from 'imagemin-webp';
import mozJpegPlugin from 'imagemin-mozjpeg';
import pngquantPlugin from 'imagemin-pngquant';
import gifLossyPlugin from 'imagemin-giflossy';
import svgoPlugin from 'imagemin-svgo';

export const processing = {
	webp: {
		quality: 100
	},
	jpg: {
		quality: 100
	},
	png: {}
};

export const optimization = {
	webp: webpPlugin(),
	jpg:  mozJpegPlugin(),
	png:  pngquantPlugin(),
	gif:  gifLossyPlugin(),
	svg:  svgoPlugin()
};

export function postfix(width: number, mul: number): string {
	return mul === 1 ? '' : `@${width}w`;
}
