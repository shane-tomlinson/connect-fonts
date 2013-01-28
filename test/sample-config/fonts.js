/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const path = require('path');

module.exports = {
  "opensans-regular": {
    "root": path.join(__dirname, "..", "sample-data"),

    "fontFamily": "Open Sans",
    "fontStyle": "normal",
    "fontWeight": "400",
    "formats": [
      {
        "type": "local",
        "url": "Open Sans"
      },
      {
        "type": "local",
        "url": "OpenSans"
      },
      {
        "type": "embedded-opentype",
        "url": "/fonts/en/opensans-regular.eot"
      },
      {
        "type": "woff",
        "url": {
          "en": "/fonts/en/opensans-regular.woff",
          "default": "/fonts/en/opensans-regular.woff"
        }
      },
      {
        "type": "truetype",
        "url": "/fonts/en/opensans-regular.ttf"
      }
      ]
  }
};

