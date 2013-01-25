/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * This module creates the required configuration for node-font-face-generator.
 *
 * The input format can be found at:
 *
 *
 * The format for node-font-face-generator can be found at:
 * https://github.com/shane-tomlinson/connect-fonts/blob/master/README.md
 */

const
util          = require('./util');


function getSortedSubdirectories(locales) {
  var subdirs = {};

  for (var locale in locales) {
    subdirs[locales[locale]] = true;
  }

  return Object.keys(subdirs).sort();
}

function getRoot(root) {
  // add a trailing slash if it does not exist.
  if (!/\/$/.test(root)) root = root + "/";
  return root;
}

function addLocalFormats(localFonts, formats) {
  if (localFonts) {
    for (var i = 0, localName; localName = localFonts[i]; ++i) {
      formats.push({
        type: "local",
        url: localName
      });
    }
  }
}

function getFontTypeForExtension(extension) {
  return ({
    woff: "woff",
    svg: "svg",
    eot: "embedded-opentype",
    ttf: "truetype"
  }[extension]);
}

function addRemoteFormats(enabledFontTypes, fontName, subdirs, formats) {
  enabledFontTypes.forEach(function(extension) {
    var format = {
      type: getFontTypeForExtension(extension),
      url: {}
    };

    for (var index = 0, subdir; subdir = subdirs[index]; ++index) {
      format.url[subdir] = "/fonts/" + subdir + "/" + fontName + "."
                              + extension;
    }

    formats.push(format);
  });
}


// This converts from the font set format to the node-font-face-generator
// configuration.
module.exports = function(config) {
  var outputConfig = {};
  var fonts = util.getRequired(config, "fonts");
  var subdirs = getSortedSubdirectories(
                    util.getRequired(config, "locale-to-subdirs"));
  var root = getRoot(util.getRequired(config, "root"));
  var enabledFontTypes = util.getRequired(config, "enabled-types");

  for (var fontName in fonts) {
    var inputFontConfig = fonts[fontName];
    var outputFontConfig = {
      fontFamily: util.getRequired(inputFontConfig, "fontFamily"),
      fontStyle: util.getRequired(inputFontConfig, "fontStyle"),
      fontWeight: util.getRequired(inputFontConfig, "fontWeight"),
      formats: [],
      // used so that connect knows where to serve the fonts from.
      root: root
    };

    addLocalFormats(inputFontConfig.local, outputFontConfig.formats);
    addRemoteFormats(enabledFontTypes, fontName, subdirs,
        outputFontConfig.formats);

    outputConfig[fontName] = outputFontConfig;
  }

  return outputConfig;
};


