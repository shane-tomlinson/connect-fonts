var fs            = require("fs"),
    css_generator = require("../server/generate_css"),
    nodeunit      = require("nodeunit");

function loadJSON(path) {
  var jsonStr = fs.readFileSync(path, "utf8");
  // strip out any comments
  jsonStr = jsonStr.replace(/\/\/.*/g, "");
  return JSON.parse(jsonStr);
}

function getFontConfig() {
  return loadJSON(__dirname + "/sample-config/fonts.json");
}

function getLanguageToLocationsConfig() {
  return loadJSON(__dirname + "/sample-config/language-to-location.json");
}

function testFormatDeclared(test, ua, types) {
  var css = css_generator.get_font_css({
    ua: ua,
    lang: "en",
    fonts: ["OpenSansRegular"]
  });

  types.forEach(function(type) {
    test.notEqual(css.indexOf(type), -1, type + " found");
  });
}

exports.setup = nodeunit.testCase({
  setUp: function (cb) {
    css_generator.setup({
      fonts: getFontConfig(),
      languageToLocations: getLanguageToLocationsConfig()
    });
    cb();
  },
  tearDown: function (cb) {
    cb();
  },
  "get correct fonts for browser": function(test) {
    testFormatDeclared(test, "Firefox", ["local", "woff"]);
    testFormatDeclared(test, "Chrome", ["local", "woff"]);
    testFormatDeclared(test, "Safari", ["local", "woff"]);
    testFormatDeclared(test, "MSIE 8.0", ["local", "eot"]);
    testFormatDeclared(test, "MSIE 9.0", ["local", "eot"]);
    testFormatDeclared(test, "Opera", ["local", "eot"]);
    testFormatDeclared(test, "iOS", ["local", "ttf"]);

    test.done();
  }
});

