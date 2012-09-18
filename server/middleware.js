/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const
css_generator = require("./generate_css");

exports.font_server = function(req, res, next) {
  res.setHeader('Content-Type', 'text/css', 'text/css; charset=utf8');

  try {
    var cssStr = css_generator.get_font_css({
      ua: req.headers['user-agent'],
      lang: req.params.lang,
      fonts: req.params.fonts.split(",")
    });

    res.send(cssStr, 200);
  }
  catch(e) {
    res.send(e.toString(), 404);
  }
};

