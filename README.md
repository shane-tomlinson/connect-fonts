# connect-fonts

Middleware to take care of all your font needs.

The middleware looks for requests (expressed in Express terminology):
```
/:locale/:font-list/fonts.css
```

An example of a match is:
```
/en/opensans-regular,opensans-italics/fonts.css
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
      allow_origin: "https://exampledomain.com"
    }));
```

`fonts` is an array of font packs.
`allow_origin` is the origin to set in the Access-Control-Allow-Origin header

4. Add a link tag to include the font CSS.
```
    <link href="/en/opensans-regular/fonts.css" type="text/css" rel="stylesheet"/ >
```

5. Set your CSS up to use the new font by using the correct font-family.
```
   body {
     font-family: 'Open Sans', 'sans-serif', 'serif';
   }
```


## Advanced Usage
Once the middleware setup function is called, a map of URLs=>paths can be retreived using font_middleware.urlToPaths.

## Creating a Font Pack
A font pack is an npm module like any other node library. Creating a new font pack is similar to creating any npm module.

1) Create a font pack directory
```
    development> mkdir connect-fonts-opensans
```

2) In the font pack directory, create a subdirectory for the fonts.
```
    connect-fonts-opensans> mkdir fonts
```

3) In the ``fonts`` directory, create one subdirectory for each supported locale with a minimum of the ``default`` subdirectory (strictly, this is optional if ``default`` is specified in locale-to-subdirs [see below])
```
    fonts> mkdir en
    fonts> mkdir default
```

4) Copy locale specific font files to the locale subdirectory.

To reduce the amount of configuration that is needed, a small amount of convention is used. Font files *must* be named the same in each subdirectory, and *must* match the name of the font that is requested when requesting ``fonts.css``.

If a font is requested using ``opensans-regular/fonts.css``, font files are expected to have a basename of ``opensans-regular``

For example:
```
    en> ls *
    opensans-regular.eot          opensans-regular.svg
    opensans-regular.ttf          opensans-regular.woff
```

5) Add a configuration file.

The configuration file must have these fields:
* ``root`` - the root directory where the fonts are found
* ``locale-to-subdirs`` - supported locales => subdirectories.
* ``enabled-types`` - An array of enabled font types. Valid options are: eot,woff, ttf, and svg
* ``fonts`` - A dictionary of fonts supported by the font pack. The key of the
  dictionary entry is the font name, the value is the configuration. The configuration must specify fontFamily, fontStyle, fontWeight and local font names.

Example:
```
    "opensans-bold": {
      "fontFamily": "Open Sans",
      "fontStyle": "normal",
      "fontWeight": "700",
      "local": [ "Open Sans Bold", "OpenSansBold" ]
    }
```

An example for the [connect-fonts-opensans](https://github.com/shane-tomlinson/connect-fonts-opensans) font pack:
```
    const path = require("path");

    module.exports = {
      "root": path.join(__dirname, "fonts"),

      // where to find a locale's fonts in the fonts directory
      "locale-to-subdirs": {
        "default": "default",
        "en": "en"
      },

      // what font types are enabled and what are the extensions of
      // the font files.
      //
      // valid types are embedded-opentype, woff, truetype, svg
      "enabled-types": [ "eot", "woff", "ttf", "svg" ],

      // The fonts. The name of the font must be the same as the font
      // in the fonts directory.
      "fonts": {
        "opensans-italic": {
          "fontFamily": "Open Sans",
          "fontStyle": "italic",
          "fontWeight": "400",
          "local": [ "Open Sans Italic", "OpenSansItalic" ]
        },

        "opensans-light": {
          "fontFamily": "Open Sans",
          "fontStyle": "normal",
          "fontWeight": "300",
          "local": [ "Open Sans Light", "OpenSansLight" ]
        },

        "opensans-regular": {
          "fontFamily": "Open Sans",
          "fontStyle": "normal",
          "fontWeight": "400",
          "local": [ "Open Sans", "OpenSans" ]
        }
      }
    };
```

6) Set up ``package.json``. ``main`` should point to the configuration file.

7) Check your font pack.

``script/check_font_pack.js`` is a basic font pack linter. It will check whether pack configuration is sane and if all expected font files are available. To use it, call ``check_font_pack.js`` with the absolute path to the font pack's configuration file.

Example:
```
    ./check_font_pack.js ~/development/connect-fonts-opensans/index.js
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
MOAR font packs! See
[connect-fonts-opensans](https://github.com/shane-tomlinson/connect-fonts-opensans) for an example.

Any updates to connect-fonts are appreciated. All submissions will be reviewed
and considered for merge.

## License:
This software is available under version 2.0 of the MPL:

  https://www.mozilla.org/MPL/


