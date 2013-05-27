# connect-fonts

Connect/Express font serving middleware. Why? Because Google's font CDN is slow and slow page loads cause users to leave your site.

The middleware looks for requests (expressed in Express terminology):
```
/:font-list/fonts.css
```

An example of a match is:
```
/opensans-regular,opensans-italics/fonts.css
```

When this route is matched, connect-fonts will generate a CSS response with @font-face declarations that are tailored to the user's browser.

## Usage
1. Include connect-fonts in a node module.
```js
const font_middleware = require("connect-fonts");
```

2. Include the font packs that you want to serve.
```js
const opensans = require("connect-fonts-opensans");
```

3. Add a middleware by calling the `setup` function.
```js
    app.use(font_middleware.setup({
      fonts: [ opensans ],
      allow_origin: "https://exampledomain.com",
      ua: "all",
      maxage: 180 * 24 * 60 * 60 * 1000   // 180 days
    }));
```
`fonts` - array of font packs.
`allow_origin` - origin to set in the Access-Control-Allow-Origin header
`ua` - force a user-agent. "all" means serve up all font types to all users. If not specified, the user's user-agent header will be used to send the user only the fonts that their user-agent support.
`maxage` - provide a max-age in milliseconds for http caching, defaults to 0.
`compress` - Whether to compress the CSS/font output

4. Add a link tag to include the font CSS.
To serve a default, non-locale specific font, include a CSS link that contains the name of the font:
```html
<link href="/opensans-regular/fonts.css" type="text/css" rel="stylesheet"/ >
```

5. Set your CSS up to use the new font by using the correct font-family.
```
    body {
      font-family: 'Open Sans', 'sans-serif', 'serif';
    }
```

## Advanced Usage

### Locale optimised fonts
If a font pack contains locale optimised fonts, these can be requested by prepending
the locale name before the font list in the fonts.css request.
```html
<link href="/en/opensans-regular/fonts.css" type="text/css" rel="stylesheet"/ >
```
`scripts/subset` from [connect-fonts-tools](https://github.com/shane-tomlinson/connect-fonts-tools) can be used to create locale-optimised subsets.


### Programatically generate CSS for use in build steps
One of the easiest ways to speed up your site is to minimize the number of resources that are requested. The @font-face CSS provided by fonts.css can be fetched programatically and concatinated with other site CSS during a build step.
```js
// font_middleware.setup has already been called.
// `ua` - user agent. Use 'all' for a CSS bundle that is compatible with all browsers.
// `lang` - language. generate_css can be called once for each served language, or
//            "default" can be specified
// `fonts` - array of font names - e.g. ["opensans-regular", "opensans-italics"]
font_middleware.generate_css(ua, lang, fonts, function(err, css) {
  var css_output_path = path.join(output_dir, dep);
  var css_output_dir = path.dirname(css_output_path);

  // create any missing directories.
  mkdirp.sync(css_output_dir);

  // finally, write out the file.
  fs.writeFileSync(css_output_path, css.css, "utf8");
});
```

### Direct access to font files
Once the middleware setup function is called, a map of URLs=>paths can be retreived using font_middleware.urlToPaths. This information can be used in a build step for tools like [connect-cachify](https://github.com/mozilla/connect-cachify/) that need access to the font file to create an caching hash.


## Creating a Font Pack
A font pack is an npm module like any other node library. Creating a new font pack is similar to creating any npm module.

1. Install [connect-fonts-tools](https://github.com/shane-tomlinson/connect-fonts-tools) and run its `scripts/setup` utility.
```bash
npm install connect-fonts-tools
cd node_modules/connect-fonts-tools
./scripts/setup
```

2. Create a font pack target directory
```bash
mkdir <target_path>
```

3. Call ``scripts/create_fontpack`` from connect-font-tools with the source directory, the target directory, and the pack name.
```bash
connect-fonts-tools/scripts/create_fontpack --pn <pack_name> --sp <source_path> --tp <target_path>
```
If the font pack is for public use, specify the additional parameters to be placed inside the font pack's package.json and README.md files.
```bash
connect-fonts-tools/scripts/create_fontpack --pn <pack_name> --ph <pack_homepage_url> --pr <pack_repo_url> --pb <pack_bugtracker_url> --sp <source_path> --tp <target_path>
```

4. Check your font pack.
``script/check_font_pack.js`` is a basic font pack linter. It will check whether pack configuration is sane and if all expected font files are available. To use it, call ``check_font_pack.js`` with the absolute path to the font pack's configuration file.
```bash
script/check_font_pack.js ~/development/connect-fonts-opensans/index.js
```

5. If the font pack is for public use, publish it to the npm repository
```bash
cd <target_path>
npm publish
```

6. Install the pack using npm into your project:
```bash
npm install <pack_name>
```
If the font pack is not to be published to the npm repository, it can be installed to another local project directory:
```bash
cd <target_project_dir>
npm install <font_pack_directory>
```

## Author:
* Shane Tomlinson
* shane@shanetomlinson.com
* stomlinson@mozilla.com
* set117@yahoo.com
* https://shanetomlinson.com
* http://github.com/stomlinson
* http://github.com/shane-tomlinson
* @shane_tomlinson

## Getting involved:
MOAR font packs! See [connect-fonts-tools](https://github.com/shane-tomlinson/connect-fonts-tools) for tools to make this easy. [connect-fonts-opensans](https://github.com/shane-tomlinson/connect-fonts-opensans) is an example of a finished font pack.

Any updates to connect-fonts are appreciated. All submissions will be reviewed and considered for merge.

## License:
This software is available under version 2.0 of the MPL:

  https://www.mozilla.org/MPL/


