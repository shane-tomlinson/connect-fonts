/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var path            = require('path'),
    nodeunit        = require('nodeunit'),
    font_config     = require('./sample-config/fonts'),
    css_responder   = require('../lib/css-responder');

exports.css_responder = nodeunit.testCase({
  setUp: function (cb) {
    cb();

  },
  tearDown: function (cb) {
    cb();
  },

  'test something': function(test) {
    test.done();
  }
});

