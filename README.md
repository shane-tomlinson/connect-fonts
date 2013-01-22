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

2. Set up your configuration.
Two configuration items are needed for the css_generator, `fonts` and
`locale_to_url_keys`.
`fonts` is an Object that holds a dictionary of fonts.
```
font_config = {
  "OpenSansRegular": {
    "fontFamily": "Open Sans",
    "fontStyle": "normal",
    "fontWeight": "400",
    "formats": [ {
        "type": "local",
        "url": "Open Sans"
      }, {
        "type": "local",
        "url": "OpenSans"
      }, {
        "type": "embedded-opentype",
        "url": "/fonts/OpenSans-Regular.eot"
      }, {
        "type": "woff",
        "url": {
          "latin": "/fonts/OpenSans-Regular-latin.woff",
          "cyrillic": "/fonts/OpenSans-Regular-cyrillic.woff",
          "extended": "/fonts/OpenSans-Regular-extended.woff"
        }
      }, {
        "type": "truetype",
        "url": {
          "latin": "/fonts/OpenSans-Regular-latin.ttf",
          "extended": "/fonts/OpenSans-Regular-extended.ttf"
        }
      } ]
  }
};
```
Multiple urls can be defined for a single font. This is useful to define
specific font files for different locale "roots". For example, latin based
locales can be specified under the "latin" url, russian under
"cyrillic", and greek under "greek". If multiple urls are defined, `extended` *must* be defined. `extended` is the default if a locale is not found in the `locale_to_url_keys` table.
`locale_to_url_keys` is an object that holds a dictionary of locales to
default urls. For example:
```
locale_to_url_keys = {
  "en":    "latin",   // will match for en, en-US, en-UK, en-CA, ...
  "es":    "latin",   // will match for es, es-MX, en-AR, en-*
  "fr"     "latin",
  "ru":    "cyrillic",
  "ro":    "cyrillic",
  "bg":    "cyrillic",
  "jp":    "japanese"
};
```
If an exact match is not found for a country specific locale, the locale's root will be used. If a locale's url is not found for a multi-url font, `extended` will be used.

3. Add a middleware by calling the `setup` function with the configuration objects.
```
app.use(font_middleware.setup({
  fonts: font_config,
  locale_to_url_keys: locale_to_url_keys
}));
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
I am happy to review submissions!

## License:
This software is available under version 2.0 of the MPL:

  https://www.mozilla.org/MPL/


