# connect-fonts-shadows-into-light

A [connect-fonts](https://github.com/shane-tomlinson/connect-fonts) fontpack for the shadowsintolight font.

## Usage

1. Include [connect-fonts](https://github.com/shane-tomlinson/connect-fonts) in a node module.
```
const font_middleware = require("connect-fonts");
```

2. Include the font packs that you want to serve.
```
const shadowsintolight = require("connect-fonts-shadows-into-light");
```

3. Add a middleware by calling the `setup` function.
```
    app.use(font_middleware.setup({
      fonts: [ shadowsintolight ],
      allow_origin: "https://exampledomain.com"
    }));
```

4. Add a link tag to include the font CSS.
```
    <link href="/en/shadows-into-light/fonts.css" type="text/css" rel="stylesheet"/ >
```

5. Set your CSS up to use the new font by using the "Source Sans Pro" font-family.
```
   body {
     font-family: 'Shadows Into Light', 'sans-serif', 'serif';
   }
```


## Author
* Shane Tomlinson
* shane@shanetomlinson.com
* stomlinson@mozilla.com
* set117@yahoo.com
* https://shanetomlinson.com
* http://github.com/stomlinson
* http://github.com/shane-tomlinson
* @shane_tomlinson

## Credits

Original font set downloaded from www.fontspace.com. Shadows Into Light created by [Kimberly Geswein](http://www.kimberlygeswein.com/)

## License

This software is licenced under version 2.0 of the MPL

  https://www.mozilla.org/MPL/

Shadows Into Light is licenced under TOU as set by Kimbery Geswein.

It is for personal use only.  If you wish to use it commercially I ask for
a one-time US $5 paypal payment to Kimberly at gesweinfamily@gmail.com

Paying the commercial license fee gives you unlimited usage of this
font for your t-shirts, advertisements, websites, whatever you wish!

For non-profit and/or non-commercial usage-- as long as your
stuff is not racist, hateful, or anti-Christian, you are free to use it as
you wish!

For all have sinned and come short of the glory of God.  Romans 3:23
For the wages of sin is death; but the free gift of God is eternal life in Christ Jesus our Lord.  Romans 6:23



