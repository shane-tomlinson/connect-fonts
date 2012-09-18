/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


var env = process.env;

var configs = {};

function extend(toExtend) {
  var mixins = [].slice.call(arguments, 1);
  for(var index=0, mixin; mixin=mixins[index]; ++index) {
    for(var key in mixin) {
      var type = Object.prototype.toString.call(mixin[key]);
      if(type === "[object Object]") {
        toExtend[key] = toExtend[key] || {};
        extend(toExtend[key], mixin[key]);
      }
      else {
        toExtend[key] = mixin[key];
      }
    }
  }
  return toExtend;
}

configs.local = {
  ip_address: env['IP_ADDRESS'] || "127.0.0.1",
  https: false,
  port: env['PORT'] || 3000,
  use_minified_resources: false
};
configs.local.url = configs.local.ip_address + ":" + configs.local.port;

configs.production = extend({}, configs.local, {
  url: "fonts.mozilla.org",
  use_minified_resources: true
});

var environment = env['NODE_ENV'] || "production";
exports.config = configs[environment];

console.log("using environment: " + environment);
console.log(exports.config);

