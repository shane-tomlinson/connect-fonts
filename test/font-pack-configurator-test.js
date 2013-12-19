/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var path                    = require('path'),
    nodeunit                = require('nodeunit'),
    configurator            = require('../lib/font-pack-configurator'),
    pack_with_default       = require('./sample-font-packs/fonts-with-default/index'),
    pack_with_default_in_locale_to_subdirs
                            = require('./sample-font-packs/fonts-with-default-in-locale-to-subdirs/index'),
    pack_without_default    = require('./sample-font-packs/fonts-without-default/index'),
    pack_missing_font       = require('./sample-font-packs/fonts-missing-font/index');

exports.font_pack_configurator = nodeunit.testCase({
  setUp: function (cb) {
    cb();
  },
  tearDown: function (cb) {
    cb();
  },

  'get font pack configuration of valid font pack': function(test) {
    var config = configurator(pack_with_default);
    test.ok("opensans-regular" in config);

    var fontConfig = config["opensans-regular"];
    test.equal(fontConfig.fontFamily, "Open Sans");
    test.equal(fontConfig.fontStyle, "normal");
    test.equal(fontConfig.fontWeight, "400");

    test.equal(fontConfig.root, path.join(__dirname, "sample-font-packs", "fonts-with-default", "fonts/"));

    // 6 fonts in config, 2 local, 5 remote.
    // four remotes are svg, woff, opentype, truetype and embedded-opentype
    test.equal(fontConfig.formats.length, 7);

    // each of the remote fonts should have three locale's specified for
    // 15 paths. (locales are en, latin, default)
    test.equal(Object.keys(fontConfig.urlToPaths).length, 15);

    // check the paths to make sure they match what is expected.
    for (var url in fontConfig.urlToPaths) {
      var fontPath = fontConfig.urlToPaths[url];
      test.equal(fontPath, fontConfig.root + url.replace('/fonts/', ''));
    }

    fontConfig.formats.forEach(function(format) {
      if (format.type === "local") {
        test.ok(format.url === "Open Sans" || format.url === "OpenSans");
      }
      else {
        test.ok("default" in format.url);
        test.ok("en" in format.url);

        test.ok(["truetype", "opentype", "svg", "embedded-opentype", "woff"]
                    .indexOf(format.type) > -1);

        // check that the format of the URL is good
        test.ok(format.url.en.indexOf(path.join(
            "fonts", "en", "opensans-regular")) > -1);
      }
    });

    test.done();
  },

  'error thrown if a font file is missing': function(test) {
    var err;

    try {
      var config = configurator(pack_missing_font);
    } catch(e) {
      err = e;
    }

    test.ok(err);
    test.done();
  }
});
