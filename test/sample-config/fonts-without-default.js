/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const path = require("path");

module.exports = {
  "root": path.join(__dirname, "..", "sample-data", "fonts-without-default"),

  // where to find a locale's fonts in the fonts directory
  "locale-to-subdirs": {
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
