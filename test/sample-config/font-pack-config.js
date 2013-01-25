const path = require("path");

module.exports = {
  "root": path.join(__dirname, "..", "sample-data"),

  // where to find a locale's fonts in the fonts directory
  "locale-to-subdirs": {
    "en": "en",
    "it-ch": "default",
    "ru": "cyrillic"
  },

  // enabled font types.
  //
  // valid types are eot, woff, ttf, svg
  "enabled-types": [ "eot", "woff", "ttf", "svg" ],

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
