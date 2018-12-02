import Vinyl from 'vinyl';
import { Metadata } from 'sharp';

export default interface ISrsetVinyl extends Vinyl {
	metadata?: Metadata;
	postfix?: string;
}
