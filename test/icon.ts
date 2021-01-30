import fs from 'fs';
import path from 'path';
import Vinyl from 'vinyl';

export default new Vinyl({
	contents: fs.readFileSync(path.join(__dirname, './images/icon.svg')),
	path: '/some/icon.svg'
});

export const expectedSize = {
	width: 216,
	height: 186
};
