/*
to do:
	want fallback for apostrophized words like MARK'D, etc, probably can have a greedy fallback that parses words
*/
var poemSource = document.getElementById("poemSource");
var setButton = document.getElementById("setButton");
var output1 = document.getElementById("output1");
var output2 = document.getElementById("output2");

var colourscheme = 	[
	"#B36305",
	"#E32017",
	"#FFD300",
	"#00782A",
	"#F3A9BB",
	"#A0A5A9",
	"#9B0056",
	//"#000000",
	"#003688",
	"#0098D4",
	"#95CDBA",
	"#00A4A7",
	"#EE7C0E",
	"#84B817",
	"#7156A5"
];

function sortByFrequency(array) {
    var frequency = {};

    array.forEach(function(value) { frequency[value] = 0; });

    var uniques = array.filter(function(value) {
        return ++frequency[value] == 1;
    });

    return uniques.sort(function(a, b) {
        return frequency[b] - frequency[a];
    });
}

function applyDelta(poem,delta){
	var result =  JSON.parse(JSON.stringify(poem));
	var i = delta[0];
	var j = delta[1];
	var w = delta[2];
	result[i][j] = w;
	return result;
}

function parseWord(w){
	var modified=true;
	var result=[];
	while (modified && w.length>0){
		modified=false;
		for (var j=w.length-1;j>=0;j--){
			var subword = w.substring(0,j);
			if (subword in pronunciation){
				modified=true;
				result.push(subword);
				w = w.substring(j);
			}
		}
	}
	if (w.length>0){
		result.push(w);
	}
	return result;
}

function generateDeltas(poemWords){
	var result= [];
	for (var i=0;i<poemWords.length;i++){
		var l = poemWords[i];
		for (var j=0;j<l.length;j++){
			var w = l[j];
			if (!(w in synset)){
				continue;
			}
			var synonyms = synset[w];
			for (var k=0;k<synonyms.length;k++){
				var syn = synonyms[k];
				if (syn===w){
					continue;
				}
				result.push([i,j,syn]);
			}
		}
	}
	return result;
}

function setClick(){
	var poem = poemSource.value;
	var lines = poem.split(/\n+/);
	var poemWords=[];
	for (var i=0;i<lines.length;i++){
		var l = lines[i];
		var words = l.split(/[ _,\-]+/);
		var words_noempty=[];
		for (var j=0;j<words.length;j++){
			var w = words[j].toLowerCase();
			if (w!==""){
				if (w in pronunciation){
					words_noempty.push(w);				
				} else {
					var ar = parseWord(w);
					for (var k=0;k<ar.length;k++){
						words_noempty.push(ar[k]);	
					}
				}
			}
		}
		poemWords.push(words_noempty);
	}

	var output1_html = "";

	for (var i=0;i<poemWords.length;i++){
		var l = poemWords[i];
		for (var j=0;j<l.length;j++){
			var w = l[j];
			if (w in pronunciation){
				output1_html += w+" ";
			} else {
				output1_html += "<span class='wordNotFound'>"+w+"</span> ";		
			}
		}
		output1_html+="<br>"
	}
	output1.innerHTML = output1_html;

	var phonemes = [];
	var phonetic_poem = [];
	for (var i=0;i<poemWords.length;i++){
		var l = poemWords[i];
		var phonetic_line = [];
		for (var j=0;j<l.length;j++){
			var w = l[j];
			if (w in pronunciation){
				var p = pronunciation[w];
				for (var k=0;k<p.length;k++){
					var phoneme = p[k];
					phonetic_line.push(phoneme);
					phonemes.push(phoneme);
				}
			}
		}
		phonetic_poem.push(phonetic_line);
	}

	var phonemes_sorted = sortByFrequency(phonemes);

	var output2_html = "";
	for (var i=0;i<phonetic_poem.length;i++){
		var l = phonetic_poem[i];
		for (var j=0;j<l.length;j++){
			var w = l[j];
			var index = phonemes_sorted.indexOf(w)
			if (index>=0&&index<colourscheme.length){
				w = "<span style='color:"+colourscheme[index]+";'>"+w+"</span>";
			}
			output2_html += w+" ";
		}
		output2_html+="<br>"
	}
	output2.innerHTML = output2_html;

	/*
	have assonance formula for set of phonemes 
		possibilities: sum of squares of frequencies
					   max(0,frequency-1)
	algorithm:
	for every word
	for every word in that synset
	generate list of all deltas
	for each delta
	replace that word by the optional one, and calculate score
	show top 10 variations, with replaced word highlighted.*/

	var deltas = generateDeltas(poemWords);

	for (var i=0;i<deltas.length;i++){
		var delta=deltas[i];
		var candPoem = applyDelta(poemWords,delta);
		var score=calcScore(candPoem);
	}
	window.console.log(deltas);
}

setButton.onclick=setClick;