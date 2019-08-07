# @flexis/srcset

[![NPM version][npm]][npm-url]
[![Node version][node]][node-url]
[![Dependencies status][deps]][deps-url]
[![Build status][build]][build-url]
[![Coverage status][coverage]][coverage-url]
[![Dependabot badge][dependabot]][dependabot-url]
[![Documentation badge][documentation]][documentation-url]

[npm]: https://img.shields.io/npm/v/@flexis/srcset.svg
[npm-url]: https://npmjs.com/package/@flexis/srcset

[node]: https://img.shields.io/node/v/@flexis/srcset.svg
[node-url]: https://nodejs.org

[deps]: https://david-dm.org/TrigenSoftware/flexis-srcset.svg
[deps-url]: https://david-dm.org/TrigenSoftware/flexis-srcset

[build]: http://img.shields.io/travis/com/TrigenSoftware/flexis-srcset/master.svg
[build-url]: https://travis-ci.com/TrigenSoftware/flexis-srcset

[coverage]: https://img.shields.io/coveralls/TrigenSoftware/flexis-srcset.svg
[coverage-url]: https://coveralls.io/r/TrigenSoftware/flexis-srcset

[dependabot]: https://api.dependabot.com/badges/status?host=github&repo=TrigenSoftware/flexis-srcset
[dependabot-url]: https://dependabot.com/

[documentation]: https://img.shields.io/badge/API-Documentation-2b7489.svg
[documentation-url]: https://trigensoftware.github.io/flexis-srcset

Highly customizable tool for generating responsive images.

- [Responsive images](https://developer.mozilla.org/ru/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images) 🌠
- Optimize images with [imagemin](https://www.npmjs.com/package/imagemin) 🗜
- Convert images to [modern formats such as WebP](https://developer.mozilla.org/ru/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images#Use_modern_image_formats_boldly) 📸
- You can run it from the [CLI](#cli) ⌨️
- Works with [Gulp](#gulp) and as [JS library](#js-api) 🦄

## Install

```bash
npm i -D @flexis/srcset
# or
yarn add -D @flexis/srcset
```

## Usage

### CLI

```sh
npx srcset [...sources] [...options]
# or
yarn exec -- srcset [...sources] [...options]
```

| Option | Description | Default |
|--------|-------------|---------|
| sources | Source image(s) glob patterns. | |
| &#x2011;&#x2011;help, -h | Print this message. | |
| &#x2011;&#x2011;verbose, -v | Print additional info about RegExps. | |
| &#x2011;&#x2011;match, -m | Glob patern(s) or media query(ies) to match image(s) by name or size. | all images |
| &#x2011;&#x2011;width, -w | Output image(s) widths to resize, value less than or equal to 1 will be detected as multiplier. | no resize |
| &#x2011;&#x2011;format, -f | Output image(s) formats to convert. | no convert |
| &#x2011;&#x2011;skipOptimization | Do not optimize output images. | `false` |
| &#x2011;&#x2011;noScalingUp | Do not generate images with higher resolution than they's sources are. | `false`
| &#x2011;&#x2011;dest, -d | Destination directory. | |

#### Example

```sh
srcset "src/images/*.jpg" --match "(min-width: 1920px)" --width 1920,1280,1024,860,540,320 --format jpg,webp -d static/images
```

#### Configuration

Configuration file is optional. If needed, can be defined through `.srcsetrc` (JSON file) or `.srcsetrc.js` in the root directory of the project.

Supported options:

```ts
interface ICommonConfig {
    processing?: Partial<IProcessingConfig>;
    optimization?: Partial<IOptimizationConfig>;
    skipOptimization?: boolean;
    scalingUp?: boolean;
    postfix?: Postfix;
}

interface IRule extends ICommonConfig {
    match?: Matcher;
    format?: SupportedExtension|SupportedExtension[];
    width?: number|number[];
}

/**
 * RC file:
 */
interface IConfig extends ICommonConfig {
    src?: string|string[];
    rules?: IRule[];
    verbose?: boolean;
    dest?: string;
}
```

- [`IProcessingConfig`](https://trigensoftware.github.io/flexis-srcset/interfaces/_htmlheaders_.iheadersconfig.html)
- [`IOptimizationConfig`](https://trigensoftware.github.io/flexis-srcset/interfaces/_htmlheaders_.iheadersconfig.html)
- [`Postfix`](https://trigensoftware.github.io/flexis-srcset/interfaces/_htmlheaders_.iheadersconfig.html)
- [`Matcher`](https://trigensoftware.github.io/flexis-srcset/interfaces/_icons_.iiconsconfig.html)
- [`SupportedExtension`](https://trigensoftware.github.io/flexis-srcset/interfaces/_manifest_.imanifestconfig.html)

### Gulp

You can use `@flexis/srcset` with [Gulp](https://github.com/gulpjs/gulp):

```js
import srcset from '@flexis/srcset/stream';

gulp.task('images', () =>
    gulp.src('src/*.{jpg,png}')
        .pipe(srcset([{
            match:  '(min-width: 3000px)',
            width:  [1920, 1280, 1024, 860, 540, 320],
            format: ['jpg', 'webp']
        }], {
            skipOptimization: true
        }))
        .pipe(gulp.dest('static'))
);
```

> NOTICE: this plugin is also available as [`gulp-srcset`](https://github.com/TrigenSoftware/gulp-srcset) package.

Plugin options:

```ts
interface ICommonConfig {
    processing?: Partial<IProcessingConfig>;
    optimization?: Partial<IOptimizationConfig>;
    skipOptimization?: boolean;
    scalingUp?: boolean;
    postfix?: Postfix;
}

/**
 * First argument: IPluginRule[]
 */
interface IPluginRule extends ICommonConfig {
    match?: Matcher;
    format?: SupportedExtension|SupportedExtension[];
    width?: number|number[];
}

/**
 * Second argument: 
 */
interface IPluginConfig extends ICommonConfig {
    verbose?: boolean;
}
```

- [`IProcessingConfig`](https://trigensoftware.github.io/flexis-srcset/interfaces/_htmlheaders_.iheadersconfig.html)
- [`IOptimizationConfig`](https://trigensoftware.github.io/flexis-srcset/interfaces/_htmlheaders_.iheadersconfig.html)
- [`Postfix`](https://trigensoftware.github.io/flexis-srcset/interfaces/_htmlheaders_.iheadersconfig.html)
- [`Matcher`](https://trigensoftware.github.io/flexis-srcset/interfaces/_icons_.iiconsconfig.html)
- [`SupportedExtension`](https://trigensoftware.github.io/flexis-srcset/interfaces/_manifest_.imanifestconfig.html)

### JS API

Module exposes next API:

```js
export default SrcsetGenerator;
export {
    IProcessingConfig,
    IOptimizationConfig,
    ISrsetVinyl,
    ISize,
    IMatcherFunction,
    SupportedExtension,
    Matcher,
    IPostfixFormatter,
    Postfix,
    IConfig,
    IGenerateConfig
    isSupportedType,
    extensions,
    attachMetadata,
    matchImage
}
```

#### Example

```js
import {
    promises as fs
} from 'fs';
import SrcsetGenerator from '@flexis/favicons';
import Vinyl from 'vinyl';

async function generate() {

    const path = 'src/background.jpg';
    const contents = await fs.readFile(path);
    const source = new Vinyl({
        path,
        contents
    });
    const srcset = new SrcsetGenerator();
    const images = favicons.generate(source, {
        width:  [1920, 1280, 1024, 860, 540, 320],
        format: ['jpg', 'webp']
    });

    for await (const image of images) {
        image.base = './static';
        await fs.writeFile(image.path, image.contents);
    }
}

generate();
```

[Description of this methods you can find in Documentation.](https://trigensoftware.github.io/flexis-srcset/index.html)
