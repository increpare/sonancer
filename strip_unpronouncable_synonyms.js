
var fs = require('fs');

// file is included here:
eval(fs.readFileSync('pronunciations.js')+'');
eval(fs.readFileSync('synsets.js')+'');

function isPronouncable(w){
	return w in pronunciation;
}


for (var key in synset){
	var syns = synset[key];
	syns = syns.filter(isPronouncable)
	var uniquesyns = syns.filter(function(item, pos) {
    return syns.indexOf(item) == pos;
	})
	synset[key] = uniquesyns;

}

var dat = JSON.stringify(synset);
dat = dat.replace(/'/g,"\\\'");
var fileDat = "var synset =JSON.parse('"+dat+"')";
fs.writeFileSync("synsets_stripped.js",fileDat);
