#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const path         = require('path'),
      configurator = require('../lib/font-pack-configurator');


var packConfigPath = process.argv[2];

if (!packConfigPath) {
  console.log("usage: " + path.basename(__filename) + " <path_to_font_pack_config>");
  process.exit(1);
}

var packConfig = require(packConfigPath);
try {
  configurator(packConfig);
} catch(e) {
  console.log(String(e));
  process.exit(1);
}

console.log("Everything looks good!");
process.exit(0);
