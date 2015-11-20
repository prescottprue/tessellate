//WARNING: This is now handled at build time with gulp within the frontend
/** refBuilder System Library
 *	@description Builds script references that are inserted into HTML templates
 */
var assets = require('../../assets');

exports.buildScriptTags = function (env){
  if(!env){
    var env = "local";
  }
  var val;
  var vendorCommentText = "\n\t\t\t<!-- Vendor Scripts -->";
  var appCommentText = "\n\t\t\t<!-- Application Scripts -->";
  var vendorScripts = scriptAssets(env, "vendor");
  var appScripts = scriptAssets(env, "app");
  val = vendorCommentText +  vendorScripts + appCommentText  + appScripts;
  if(env !="local"){
    var trackJs = '\n\t\t\t<!-- TRACKJS -->' + "\n\t\t\t<script>window._trackJs = { token: '8b473bfbdb734c5cb8097ed20cf2324c' };</script>\n\t\t\t<script" + ' src="https://d2zah9y47r7bi2.cloudfront.net/releases/current/tracker.js" crossorigin="anonymous"></script>'
    val += trackJs;
  }
  return val;
};
exports.buildStyleTags = function (env){
  if(!env){
    var env = "local";
  }
  var commentText = "\t\t<!-- Styles -->";
  return commentText + styleAssets(env, "styles");
};
//Builds script tags based on environment and asset name
function scriptAssets(env, name){
  //NOTE: Vendor lib is always direct reference
  if (env && env === 'local' && assets[name] || name === 'vendor') {
    // Directly reference scripts
    var scriptTags = assets[name].map(function (url) {
      return '\n\t\t\t<script src="' + url + '"></script>';
    });
    return scriptTags.join("");
  } else {
    var path = name + '.js';
    if(name == "app"){
      path = "hypercube.js";
    }
    return '\n\t\t\t<script src="' + path + '"></script>';
  }
}
function styleAssets(env, name){
  if (env && env === 'local' && assets[name]) {
    var scriptTags = assets[name].map(function (url) {
      return '\n\t\t<link rel="stylesheet" href="' + url + '"></link>';
    });
    return scriptTags.join("");
  } else {
    var path = 'app.css';
    return '\n\t\t<link rel="stylesheet" href="./styles/' + path + '"></link>';
  }
}
