/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * This module creates the required configuration for node-font-face-generator,
 * css-responder and font-responder.
 *
 * The input format can be found at:
 *
 *
 * The format for node-font-face-generator can be found at:
 * https://github.com/shane-tomlinson/connect-fonts/blob/master/README.md
 */

const path          = require("path"),
      util          = require("./util");


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

function addRemoteFormats(enabledFontTypes, fontName, root, subdirs, formats, urlToPaths) {
  enabledFontTypes.forEach(function(extension) {
    var format = {
      type: getFontTypeForExtension(extension),
      url: {}
    };

    for (var index = 0, subdir; subdir = subdirs[index]; ++index) {
      var url = format.url[subdir] = "/fonts/" + subdir + "/" + fontName + "."
                              + extension;

      urlToPaths[url] = path.join(root, subdir, fontName + "." + extension);
    }

    formats.push(format);
  });
}


/**
 * Convert from the font set format to the node-font-face-generator,
 * css-responder and font-responder formats.
 */
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
      // root is used to calculate the urlToPaths
      root: root,
      // A map of url to paths on disk. Used to serve font files.
      urlToPaths: {}
    };

    addLocalFormats(inputFontConfig.local, outputFontConfig.formats);
    addRemoteFormats(enabledFontTypes, fontName, root, subdirs,
        outputFontConfig.formats, outputFontConfig.urlToPaths);

    outputConfig[fontName] = outputFontConfig;
  }

  return outputConfig;
};


