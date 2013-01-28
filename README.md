# connect-fonts

Middleware that serves locale and browser specific font CSS. Useful to serve
region specific font files to avoid font-bloat.

The middleware looks for requests (expressed in Express terminology):
```
/:locale/:font-list/fonts.css
```

An example of a match is:
```
/en/OpenSansRegular,OpenSansItalics/fonts.css
```

When this route is matched, connect-fonts will generate a CSS response with @font-face declarations that are tailored to the locale and browser.

## Usage
1. Include connect-fonts in a node module.
```
const font_middleware = require("connect-fonts");
```

2. Include the font packs that you want to serve.
```
const opensans = require("connect-fonts-opensans");
```

3. Add a middleware by calling the `setup` function.
```
app.use(font_middleware.setup({
  fonts: [ opensans ],
  allow_origin: "https://exampledomain/com"
}));
```

`fonts` is an array of font packs.
`allow_origin` is the origin to set in the Allow-Origin-Access-Control header

## Advanced Usage
Once the middleware setup function is called, a map of URLs=>paths can be retreived using font_middleware.urlToPaths.

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
Additional font packs would be extremely useful. See connect-fonts-opensans for
an example.

I am happy to review submissions!

## License:
This software is available under version 2.0 of the MPL:

  https://www.mozilla.org/MPL/


