/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const fs        = require("fs");

/**
 * A Send mock for unit testing
 */

function Send() {
  return function (req, fontPath, options) {
    options = options || {};
    return {
      pipe: function(res) {
        // shove the maxage directly onto the result so that it can be
        // checked later.
        res.data = fs.readFileSync(fontPath, 'utf8');
        res.maxage = options.maxage;
        res.end();
      },
      maxage: function(maxage) {
        options.maxage = maxage;
        return this;
      }
    };
  };
}

module.exports = Send;

