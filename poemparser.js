/*
to do:
	want fallback for apostrophized words like MARK'D, etc, probably can have a greedy fallback that parses words
*/
var poemSource = document.getElementById("poemSource");
var setButton = document.getElementById("setButton");
var output1 = document.getElementById("output1");
var output2 = document.getElementById("output2");

var colourscheme = 	[
	"#f00",
	"#e00",
	"#d00",
	"#c00",
	"#b00",
	"#a00",
	"#900",
	"#800",
	"#700",
	"#600",
	"#500",
	"#000"
];

colourscheme.reverse();

function calcFrequencies(array) {
    var frequency = {};

    array.forEach(function(value) { frequency[value] = 0; });

    var uniques = array.filter(function(value) {
        return ++frequency[value] == 1;
    });

    uniques = uniques.sort(function(a, b) {
        return frequency[b] - frequency[a];
    });

    frequency["_MAX_"]=frequency[uniques[0]];
    return frequency;
}

function applyDelta(poem,delta){
	var result =  JSON.parse(JSON.stringify(poem));
	var i = delta[0];
	var j = delta[1];
	var w = delta[2];
	if (w in pronunciation){
		result[i][j] = w;
	} else {
		var words = w.split(/[ _,\-]+/);
		for (var l=0;l<words.length;l++){
			var w = words[l];
			var ws = parseWord(w);
			result[i].splice(j,1);
			for (var k=0;k<ws.length;k++){
				result[i].splice(j+k,0,ws[k]);
			}
		}
	}
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
				if (!(syn in pronunciation)){
					continue;
				}
				if (synonyms.indexOf(syn)<k){
					continue;
				}
				if (syn===w){
					continue;
				}
				result.push([i,j,syn]);
			}
		}
	}
	return result;
}

function flattenPoem(poem){
	var result=[];
	for (var i=0;i<poem.length;i++){
		var l = poem[i];
		for (var j=0;j<l.length;j++){
			var w = l[j];
			result.push(w);
		}
	}
	return result;
}

function flattenWords(words){
	var result=[];
	for (var i=0;i<words.length;i++){
		var w = words[i];
		if (w in pronunciation){
			var ph = pronunciation[w];
			for (var j=0;j<ph.length;j++){
				var phoneme=ph[j];

				var accented = phoneme.indexOf('1')>=0;
				if (accented===false && result.length>0){
				//	result.pop();
					continue;
				}
				var idx = Math.max(
					phoneme.indexOf('0'),
					phoneme.indexOf('1'),
					phoneme.indexOf('2'));
				if (idx>=0){
					phoneme = phoneme.substring(0,idx);
				}

				result.push(phoneme);
			}
		}
	}
	return result;
}
var vowels =['a','e','i','o','u','y'];
var sibilants =['s','z'];
var consonants =['b','c','d','f','g','h','j','k','l','m','n','p','q','r','s','t','v','w','x','z'];

function calcScore(poem,oldPoem){
	var words = flattenPoem(poem);
	var phonemes = flattenWords(words);

	var oldWords = flattenPoem(poem);
	var oldPhonemes = flattenWords(words);
 
 	var frequency = {};
 	var oldFrequency = {};

    phonemes.forEach(function(value) { frequency[value] = 0; });
    oldPhonemes.forEach(function(value) { oldFrequency[value] = 0; });

    var uniques = phonemes.filter(function(value) {
        return ++frequency[value] == 1;
    });

    var oldUniques = oldPhonemes.filter(function(value) {
        return ++oldFrequency[value] == 1;
    });


    uniques = uniques.sort(function(a, b) {
        return frequency[b] - frequency[a];
    });
    
    oldUniques = oldUniques.sort(function(a, b) {
        return oldFrequency[b] - oldFrequency[a];
    });

    var score = 0;
    for (var i=0;i<uniques.length;i++){
    	var phoneme =  uniques[i];
    	//if (sibilants.indexOf(phoneme.charAt(0))===-1){
    	//	continue;
    	//}
    	var f = frequency[phoneme];
    	score += f*f;//Math.max(f-1,0);
    }
   /* if (phonemes.length!=oldPhonemes.length){
    	score*=Math.exp(-(phonemes.length-oldPhonemes.length)/oldPhonemes.length);
    }
    if (uniques.length!=oldUniques.length){
    	score*=Math.exp(-(uniques.length-oldUniques.length)/oldUniques.length);
    } */
    return score/(phonemes.length*phonemes.length);
}

function calcPhonetics(poemWords){
	var phonetic_poem=[]
	var phonemes=[]
	for (var i=0;i<poemWords.length;i++){
		var l = poemWords[i];
		var phonetic_line = [];
		for (var j=0;j<l.length;j++){
			var w = l[j];
			if (w in pronunciation){
				var p = pronunciation[w];
				var word = [];
				for (var k=0;k<p.length;k++){
					var phoneme = p[k];
					var idx = Math.max(
						phoneme.indexOf('0'),
						phoneme.indexOf('1'),
						phoneme.indexOf('2'));
					if (idx>=0){
						phoneme = phoneme.substring(0,idx);
					}
					word.push(phoneme);
					phonemes.push(phoneme);
				}
				phonetic_line.push(word);
			}
		}
		phonetic_poem.push(phonetic_line);
	}
	return [phonetic_poem,phonemes];
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
	output1_html +="<p><b> score : "+calcScore(poemWords,poemWords)+"</b><br>";

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


	var r = calcPhonetics(poemWords);
	var phonetic_poem = r[0];
	var phonemes = r[1];
	var frequency = calcFrequencies(phonemes);
	var max = frequency["_MAX_"];
	//output1_html += "<br>";
	for (var i=0;i<phonetic_poem.length;i++){
		var l = phonetic_poem[i];
		for (var j=0;j<l.length;j++){
			var w = l[j];
			for (var k=0;k<w.length;k++){
				var ph = w[k];
				var freq = frequency[ph];
				if (max>1){
					ph = "<span style='color:"+colourscheme[Math.floor((colourscheme.length-1)*(freq===max?1:((freq-1)/(max))))]+";'>"+ph+"</span>";
				}
				output1_html += ph+" ";
			}
			output1_html+="&nbsp;&nbsp;&nbsp;";
		}
		output1_html+="<br>"
	}
	output1.innerHTML = output1_html;

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
		var score=calcScore(candPoem,poemWords);
		delta.push(score);
	}


    deltas = deltas.sort(function(a, b) {
        return b[3] - a[3];
    });


	var output2_html = "";
    for (var i=0;i<Math.min(20,deltas.length);i++){
    	var delta=deltas[i];
    	output2_html+="<hr>";
    	var candPoem = applyDelta(poemWords,delta);
    	var score = calcScore(candPoem,candPoem);
    	output2_html+="<b> score : "+score+"</b><br>";
    	for (var j=0;j<poemWords.length;j++){
    		var line=poemWords[j];
    		for (var k=0;k<line.length;k++){
    			var w = line[k];
    			if (j===delta[0]&&k===delta[1]){
    				w = "<span style='background-color:red;'>"+delta[2]+"</span>";
    			}
    			output2_html+=w+" ";
    		}
    		output2_html+="<br>";
    	}

		var r = calcPhonetics(candPoem);
		var phonetic_poem = r[0];
		var phonemes = r[1];
		var frequency = calcFrequencies(phonemes);
		var max = frequency["_MAX_"];
		for (var m=0;m<phonetic_poem.length;m++){
			var l = phonetic_poem[m];
			for (var j=0;j<l.length;j++){
				var w = l[j];
				if (m===delta[0]&&j===delta[1]){
					output2_html += "<span style='text-decoration: underline;'>";
				}
				for (var k=0;k<w.length;k++){
					var ph = w[k];
					var freq = frequency[ph];
					if (max>1){
						freq = "<span style='color:"+colourscheme[Math.floor((colourscheme.length-1)*(freq===max?1:((freq-1)/(max))))]+";'>"+ph+"</span>";
					}
					output2_html += freq+" ";
				}
				if (m===delta[0]&&j===delta[1]){
					output2_html += "</span>";
				}
				output2_html+="&nbsp;&nbsp;&nbsp;";
			}
			output2_html+="<br>"
		}
    }
	output2.innerHTML = output2_html;

	window.console.log(deltas);
}

setButton.onclick=setClick;