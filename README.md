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


