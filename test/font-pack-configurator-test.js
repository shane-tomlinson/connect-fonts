/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var path            = require('path'),
    nodeunit        = require('nodeunit'),
    configurator    = require('../lib/font-pack-configurator'),
    pack_config     = require('./sample-config/font-pack-config');

exports.font_pack_configurator = nodeunit.testCase({
  setUp: function (cb) {
    cb();
  },
  tearDown: function (cb) {
    cb();
  },

  'get font pack configuration': function(test) {
    var config = configurator(pack_config);
    test.ok("opensans-regular" in config);

    var fontConfig = config["opensans-regular"];
    test.equal(fontConfig.fontFamily, "Open Sans");
    test.equal(fontConfig.fontStyle, "normal");
    test.equal(fontConfig.fontWeight, "400");

    test.equal(fontConfig.root, path.join(__dirname, "sample-data/"));

    // 6 fonts in config, 2 local, 4 remote.
    // four remotes are svg, woff, truetype and embedded-opentype
    test.equal(fontConfig.formats.length, 6);

    // each of the four remote fonts should have three locale's specified for
    // 12 paths.
    test.equal(Object.keys(fontConfig.urlToPath).length, 12);

    // check the paths to make sure they match what is expected.
    for (var url in fontConfig.urlToPath) {
      var fontPath = fontConfig.urlToPath[url];
      test.equal(fontPath, fontConfig.root + url.replace('/fonts/', ''));
    }

    fontConfig.formats.forEach(function(format) {
      if (format.type === "local") {
        test.ok(format.url === "Open Sans" || format.url === "OpenSans");
      }
      else {
        test.ok("cyrillic" in format.url);
        test.ok("default" in format.url);
        test.ok("en" in format.url);

        test.ok(["truetype", "svg", "embedded-opentype", "woff"]
                    .indexOf(format.type) > -1);

        // check that the format of the URL is good
        test.ok(format.url.cyrillic.indexOf(path.join(
            "/fonts/cyrillic", format, "opensans-regular")) === 0);
      }
    });

    test.done();
  }
});
