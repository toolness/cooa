var fs = require('fs');
var url = require('url');
var cheerio = require('cheerio');

var filename = process.argv[2].replace(/\\/g, '/');
var html = fs.readFileSync(filename, 'utf-8');
var $ = cheerio.load(html);

var ROOT_STATIC_URL = process.env['ROOT_STATIC_URL'] ||
                      '//httpsify.herokuapp.com/toolness.github.io/cooa/';
var baseURL = ROOT_STATIC_URL + filename;

function rewriteLinks(attr) {
  $('[' + attr + ']').each(function() {
    var link = this.attr(attr);
    var absoluteURL = url.resolve(baseURL, link);

    if (absoluteURL.indexOf(baseURL) != 0)
      this.attr(attr, absoluteURL);
  });
}

['src', 'href', 'data-datgui-href'].forEach(rewriteLinks);
console.log($.html());
