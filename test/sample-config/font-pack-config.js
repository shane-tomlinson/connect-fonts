module.exports = {
  "root": __dirname,

  // where to find a locale's fonts in the fonts directory
  "locale-to-subdirs": {
    "en": "en",
    "it-ch": "default",
    "ru": "cyrillic"
  },

  // what font types are enabled and what are the extensions of
  // the font files.
  //
  // valid types are embedded-opentype, woff, truetype, svg
  "enabled-types": {
    "embedded-opentype": "eot",
    "woff": "woff",
    "truetype": "ttf",
    "svg": "svg"
  },

  // The fonts. The name of the font must be the same as the font
  // in the fonts directory.
  "fonts": {
    "opensans-regular": {
      "fontFamily": "Open Sans",
      "fontStyle": "normal",
      "fontWeight": "400",
      "local": [ "Open Sans", "OpenSans" ]
    }
  }
};
