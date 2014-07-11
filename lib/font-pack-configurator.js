/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * This module creates the required configuration for node-font-face-generator,
 * css-responder and font-responder.
 *
 * The input format can be found at:
 *
 * The format for node-font-face-generator can be found at:
 * https://github.com/shane-tomlinson/connect-fonts/blob/master/README.md
 */

const path               = require("path"),
      fs                 = require("fs"),
      util               = require("./util"),
      css_generator      = require("node-font-face-generator"),
      InvalidConfigError   = css_generator.InvalidConfigError;

var existsSync = fs.existsSync || path.existsSync;

function getSortedSubdirectories(root) {
  var subdirs = {};

  // first, make a list of all directories in the root.
  var files = fs.readdirSync(root);
  files.forEach(function(file) {
    var filePath = path.join(root, file);
    var stats = fs.statSync(filePath);

    if (stats.isDirectory()) subdirs[file] = true;
  });

  return Object.keys(subdirs).sort();
}

function getRoot(root) {
  // add a trailing slash if it does not exist.
  if (!/\/$/.test(root)) root = root + "/";
  return root;
}

function addLocalFormats(localFonts, formats) {
  if (localFonts) {
    localFonts.forEach(function(localName) {
      formats.push({
        type: "local",
        url: localName
      });
    });
  }
}

function extensionToFontType(extension) {
  return ({
    woff: "woff",
    svg: "svg",
    eot: "embedded-opentype",
    ttf: "truetype",
    otf: "opentype"
  }[extension]);
}

function addRemoteFormats(enabledFontTypes, fontName, root, locales,
    formats, urlToPaths) {
  enabledFontTypes.forEach(function(extension) {
    var format = {
      type: extensionToFontType(extension),
      url: {}
    };

    if (extension === "svg") {
      format.id = fontName;
    }

    // each locale is in its own subdir. Add the fonts available in each subdir
    // to the font list. ensure any locales specified in localeToSubdirs
    // are added correctly to the list.
    locales.forEach(function(locale) {
      var url = format.url[locale] = getFontUrl(locale, fontName, extension);
      var fontPath = urlToPaths[url] = getFontPath(root, locale, fontName, extension);

      // Check whether the font file exists. If not, wah wah.
      if (!existsSync(fontPath)) throw new InvalidConfigError("Missing font file: " + fontPath);
    });

    formats.push(format);
  });
}

function getFontUrl(locale, fontName, extension) {
  return ["", "fonts", locale, fontName + "." + extension].join("/");
}

function getFontPath(root, locale, fontName, extension) {
  return path.join(root, locale, fontName + "." + extension);
}

/**
 * Convert from the font set format to the node-font-face-generator,
 * css-responder and font-responder formats.
 * @throws InvalidConfigError - thrown if a font file is missing
 */
module.exports = function(config) {
  var outputConfig = {};
  var fonts = util.getRequired(config, "fonts");
  var root = getRoot(util.getRequired(config, "root"));
  var localeToSubdirs = config["locale-to-subdirs"] || {};
  var subdirs = getSortedSubdirectories(root);

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
      urlToPaths: {},
      // Use the font pack specific locale-to-subdirs as the localeToUrlKeys to
      // pass to node-font-face-generator. node-font-face-generator will take
      // care of any aliasing or searching for default fonts.
      localeToUrlKeys: localeToSubdirs
    };

    addLocalFormats(inputFontConfig.local, outputFontConfig.formats);
    addRemoteFormats(enabledFontTypes, fontName, root, subdirs,
        outputFontConfig.formats, outputFontConfig.urlToPaths);

    outputConfig[fontName] = outputFontConfig;
  }

  return outputConfig;
};


