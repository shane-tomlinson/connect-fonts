/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const
css_generator      = require("node-font-face-generator"),
MissingConfigError = css_generator.MissingConfigError;

exports.getRequired = function(options, name) {
  if (!options) {
    throw new MissingConfigError("options not specified");
  }
  else if (name && !(name in options)) {
    throw new MissingConfigError("Missing required option: " + name);
  }

  return name ? options[name] : options;
};

exports.checkRequired = function(options, name) {
  exports.getRequired(options, name);
};


