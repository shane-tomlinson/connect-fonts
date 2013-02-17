/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var path            = require('path'),
    nodeunit        = require('nodeunit'),
    ReqMock         = require('./mocks/req-mock'),
    ResMock         = require('./mocks/res-mock'),
    font_config     = require('./sample-config/fonts'),
    css_responder   = require('../lib/css-responder');

exports.css_responder = nodeunit.testCase({
  setUp: function (cb) {
    css_responder.setup({
      fonts: font_config,
      locale_to_url_keys: {}
    });
    cb();
  },
  tearDown: function (cb) {
    cb();
  },

  'generate_css generates CSS': function(test) {
    css_responder.generate_css("Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:21.0) Gecko/20130125 Firefox/21.0", "en", ["opensans-regular"], function(err, cssObj) {
      test.equal(err, null);
      test.ok(cssObj.css.length);
      test.done();
    });
  },

  'get_css gets CSS': function(test) {
    css_responder.get_css("Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:21.0) Gecko/20130125 Firefox/21.0", "en", ["opensans-regular"], function(err, cssObj) {
      test.equal(err, null);
      test.ok(cssObj.css.length);
      test.done();
    });
  },

  'font_css_responder responds to font.css requests': function(test) {
    var req = new ReqMock({
      url: '/en/opensans-regular/fonts.css',
      method: 'GET',
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:21.0) Gecko/20130125 Firefox/21.0"
    });

    var res = new ResMock({
      end: function() {
        console.log("called?");
        test.equal(this.getHeader('Content-Type'), 'text/css; charset=utf8');
        test.equal(this.getStatusCode(), 200, '200 success response expected');
        test.done();
      }
    });

    css_responder.font_css_responder(req, res, function() {
      // this should not be called.
      test.ok(false);
      test.done();
    });
  }
});

