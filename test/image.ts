import fs from 'fs';
import path from 'path';
import Vinyl from 'vinyl';

export default new Vinyl({
	contents: fs.readFileSync(path.join(path.dirname(__filename), './image.jpg')),
	path:     '/some/image.jpg'
});

export const expectedSize = {
	width: 3120,
	height: 4160
};
