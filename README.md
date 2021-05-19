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

[build]: https://img.shields.io/github/workflow/status/TrigenSoftware/flexis-srcset/CI.svg
[build-url]: https://github.com/TrigenSoftware/flexis-srcset/actions

[coverage]: https://img.shields.io/coveralls/TrigenSoftware/flexis-srcset.svg
[coverage-url]: https://coveralls.io/r/TrigenSoftware/flexis-srcset

[dependabot]: https://api.dependabot.com/badges/status?host=github&repo=TrigenSoftware/flexis-srcset
[dependabot-url]: https://dependabot.com/

[documentation]: https://img.shields.io/badge/API-Documentation-2b7489.svg
[documentation-url]: https://trigensoftware.github.io/flexis-srcset

Highly customizable tool for generating responsive images.

- [Responsive images](https://developer.mozilla.org/ru/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images) 🌠
- Optimize images with [imagemin](https://www.npmjs.com/package/imagemin) 🗜
- Convert images to [modern formats](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images#use_modern_image_formats_boldly) such as [WebP](https://developers.google.com/speed/webp) and [AVIF](https://jakearchibald.com/2020/avif-has-landed/) 📸
- You can run it from the [CLI](#cli) ⌨️
- Works with [Gulp](#gulp), [Webpack](https://github.com/TrigenSoftware/flexis-srcset-loader) and as [JS library](#js-api) 🦄

<img src="https://pbs.twimg.com/media/ECeCK9jXoAIN_E0?format=jpg&name=large" width="90%">

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
| sources | Source image(s) glob patterns. | required |
| &#x2011;&#x2011;help, -h | Print this message. | |
| &#x2011;&#x2011;verbose, -v | Print additional info about progress. | |
| &#x2011;&#x2011;match, -m | Glob patern(s) or media query(ies) to match image(s) by name or size. | all images |
| &#x2011;&#x2011;width, -w | Output image(s) widths to resize, value less than or equal to 1 will be detected as multiplier. | no resize |
| &#x2011;&#x2011;format, -f | Output image(s) formats to convert. | no convert |
| &#x2011;&#x2011;skipOptimization | Do not optimize output images. | `false` |
| &#x2011;&#x2011;noScalingUp | Do not generate images with higher resolution than they's sources are. | `false`
| &#x2011;&#x2011;dest, -d | Destination directory. | required |

#### Example

```sh
srcset "src/images/*.jpg" --match "(min-width: 1920px)" --width 1920,1280,1024,860,540,320 --format jpg,webp -d static/images
```

### Configuration

#### Common options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| processing | Partial\<[IProcessingConfig]\> | Object with Sharp configs for each supported format. | see [defaults.ts](src/defaults.ts) |
| optimization | Partial\<[IOptimizationConfig]\> | Object with imagemin plugins for each format. | see [defaults.ts](src/defaults.ts) |
| skipOptimization | boolean | Do not optimize output images. | `false` |
| scalingUp | boolean | Generate images with higher resolution than they's sources are. | `true` |
| postfix | [Postfix] | Postfix string or function to generate postfix for image. | see [defaults.ts](src/defaults.ts) |

#### Constructor options

Extends [common options](#common-options).

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| concurrency | number | Concurrency limit. | `os.cpus().length` |
| limit | [Limit](https://www.npmjs.com/package/p-limit) | p-limit's limit. | `pLimit(concurrency)` |

#### Rule options

Extends [common options](#common-options).

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| match | [Matcher] | There is support of 3 types of matchers:<br>1. Glob pattern of file path;<br>2. Media query to match image by size;<br>3. `(path: string, size: ISize, source: Vinyl) => boolean` function. | all images |
| format | [SupportedExtension] \| [SupportedExtension]\[\] | Output image(s) formats to convert. | no convert |
| width | number \| number[] | Output image(s) widths to resize, value less than or equal to 1 will be detected as multiplier. | `[1]` |

#### Configuration file

Configuration file is optional. If needed, can be defined through `.srcsetrc` (JSON file) or `.srcsetrc.js` in the root directory of the project.

Supported options, extends [common options](#common-options):

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| src | string \| string[] | Source image(s) glob patterns. | required |
| rules | [IRule](#rule-options)\[\] | Rules. | `[]` |
| verbose | boolean | Print additional info about progress. | `false` |
| dest | string | Destination directory. | required |

[IProcessingConfig]: https://trigensoftware.github.io/flexis-srcset/interfaces/types.iprocessingconfig.html
[IOptimizationConfig]: https://trigensoftware.github.io/flexis-srcset/interfaces/types.ioptimizationconfig.html
[Postfix]: https://trigensoftware.github.io/flexis-srcset/modules/types.html#postfix
[Matcher]: https://trigensoftware.github.io/flexis-srcset/modules/helpers.html#matcher
[SupportedExtension]: https://trigensoftware.github.io/flexis-srcset/modules/extensions.html#supportedextension

### Gulp

You can use `@flexis/srcset` with [Gulp](https://github.com/gulpjs/gulp):

```js
import srcSet from '@flexis/srcset/lib/stream';

gulp.task('images', () =>
    gulp.src('src/*.{jpg,png}')
        .pipe(srcSet([{
            match: '(min-width: 3000px)',
            width: [1920, 1280, 1024, 860, 540, 320],
            format: ['jpg', 'webp']
        }, {
            match: '(max-width: 3000px)',
            width: [1, .5],
            format: ['jpg', 'webp']
        }], {
            skipOptimization: true
        }))
        .pipe(gulp.dest('static'))
);
```

Plugin options:

First argument is [IRule](#rule-options)\[\], second argument extends [common options](#common-options):

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| verbose | boolean | Print additional info about progress. | `false` |

### JS API

Module exposes next API:

```js
export default SrcSetGenerator;
export {
    IProcessingConfig,
    IOptimizationConfig,
    ISrcSetVinyl,
    ISize,
    IMatcherFunction,
    SupportedExtension,
    Matcher,
    IPostfixFormatter,
    Postfix,
    IConfig,
    IGenerateConfig,
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
import SrcSetGenerator from '@flexis/favicons';
import Vinyl from 'vinyl';

async function generate() {
    const path = 'src/background.jpg';
    const contents = await fs.readFile(path);
    const source = new Vinyl({
        path,
        contents
    });
    const srcSet = new SrcSetGenerator();
    const images = srcSet.generate(source, {
        width: [1920, 1280, 1024, 860, 540, 320],
        format: ['jpg', 'webp']
    });

    for await (const image of images) {
        image.base = './static';
        await fs.writeFile(image.path, image.contents);
    }
}

generate();
```

[Description of all methods you can find in Documentation.](https://trigensoftware.github.io/flexis-srcset/index.html)
