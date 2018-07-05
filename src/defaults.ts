import webpPlugin from 'imagemin-webp';
import mozJpegPlugin from 'imagemin-mozjpeg';
import zopfliPlugin from 'imagemin-zopfli';
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
	webp: webpPlugin({
		quality: 100
	}),
	jpg:  mozJpegPlugin({
		quality: 100
	}),
	png:  zopfliPlugin(),
	gif:  gifLossyPlugin(),
	svg:  svgoPlugin()
};

export function postfix(width: number, mul: number): string {
	return mul === 1 ? '' : `@${width}w`;
}
