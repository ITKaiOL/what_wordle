(function() {

  const COUNTDOWN_TIME = 1;
  const REF = 'https://www.reddit.com/r/wordle/comments/s4tcw8/a_note_on_wordles_word_list/';

  const dataFiles = [
    'tree1.json',
    'tree2.json',
    'tree3.json'
  ];

  const WSIZE = 5;
  const CORRECT = 'C'.repeat(WSIZE);
  
  const data = {};
  const sections = {};
  
  // Wait for DOM
  function waitDOM() {
    return new Promise((resolve, reject) => {
      document.addEventListener('DOMContentLoaded', ()=> {
        resolve();
      });
    });
  }
  
  // Count down on front page
  function countDown() {
    const secondsElement = document.getElementById('seconds-text');    
    return new Promise((resolve, reject) => {
      function _countDown(counter) {
        if(counter > 0) {
          secondsElement.textContent = counter + ' second' + (counter>1?'s':'');
          setTimeout(()=>_countDown(counter-1), 1000);
        } else {
          resolve();
        }
      }
      _countDown(COUNTDOWN_TIME);
    });
  }
  
  // hide count down
  function hideStopper() {
    document.getElementById('stopper').style.display = 'none';
  }
  
  // data loader
  function loadDataFile(file) {
    data[file] = null;
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.responseType = 'json';
      xhr.addEventListener('load', (event) => {
        data[file] = event.target.response;
        data[file].stat = preprocessData(data[file].root);
        resolve();
      });
      xhr.open('GET', 'data/'+file);
      xhr.send();
    });
  }
  
  // preprocess data
  // restructure data
  function preprocessData(data) {

    // stat managing
    data.stat = [];
    function incStat(level, count) {
      while(data.stat.length <= level)
        data.stat.push(0);
      data.stat[level] += count;
    }
    
    if(data.guessMap) {
      const newGuessMap = {};
      for(const key in data.guessMap) {
        const node = data.guessMap[key]
        
        // populate stat bottom up
        if(key === CORRECT) {
          node.stat = [1];
          incStat(1, 1);
        } else {
          const stat = preprocessData(node);
          for(let l = 0; l < stat.length; ++l) {
            incStat(l+1, stat[l]);
          }
        }
        
        // handle multi-keys
        const keykeys = key.split('/');
        if(keykeys.length === 1) {
          newGuessMap[key] = node;
        } else {
          for(let k = 0; k < keykeys.length; ++k) {
            newGuessMap[keykeys[k]] = node;
          }
        }
      }
      data.guessMap = newGuessMap;
    }
    return data.stat;
  }
  
  // build base UI
  function buildUI() {
    return new Promise((resolve, reject) => {
      addStopper();
      const structure = addStructure();
      addSections(structure);
      addFooter();
      resolve();
    });
  }
  
  // add count down UI
  function addStopper() {
    const stopper = document.createElement('div');
    stopper.id = 'stopper';
    document.body.appendChild(stopper);
    
    const stopper_p = document.createElement('p');
    stopper.appendChild(stopper_p);
    
    const secondsElement = document.createElement('span');
    secondsElement.id = 'seconds-text'
    stopper_p.appendChild(secondsElement);
    stopper_p.appendChild(document.createTextNode(' before you ruin your Wordle game.'));
    stopper_p.appendChild(document.createElement('br'));
    stopper_p.appendChild(document.createTextNode('You should LEAVE NOW if you still want to play.'));    
  }
  
  // base structure
  function addStructure() {
    const buttons = document.createElement('div');
    buttons.className = 'buttons';
    document.body.appendChild(buttons);
    
    const contents = document.createElement('div');
    contents.className = 'contents';
    document.body.appendChild(contents);
    
    return { buttons: buttons, contents: contents };    
  }
  
  // sections
  function addSections(structure) {
    for(let i = 0; i < dataFiles.length; ++i) {
      const file = dataFiles[i];
      sections[file] = {
        button: document.createElement('button'),
        card: document.createElement('section'),
        stat: document.createElement('div')
      };
      sections[file].button.textContent = data[file].label;
      structure.buttons.appendChild(sections[file].button);
      structure.contents.appendChild(sections[file].card);
      sections[file].card.appendChild(sections[file].stat);
      sections[file].stat.className = 'stat';
      
      let sum = 0;
      let count = 0;
      for(let level = 1; level < data[file].stat.length; ++level) {
        sections[file].stat.appendChild(document.createTextNode(level + ' guess' + (level>1?'es':'') + ': ' + data[file].stat[level]));
        sections[file].stat.appendChild(document.createElement('br'));
        sum += level * data[file].stat[level];
        count += data[file].stat[level];
      }
      sections[file].stat.appendChild(document.createTextNode('Average: ' + (sum/count).toFixed(2)));
      
      sections[file].button.addEventListener('click', ()=>{
        selectSection(file);
      });
      generateSection(data[file].root, sections[file].card);
    }
    selectSection(dataFiles[0]);
  }
  
  // section selection mechanism
  function selectSection(file) {
    for(const f in sections) {
      if(file === f) {
        sections[f].button.className = 'on';
        sections[f].card.style.display = 'flex';
      } else {
        sections[f].button.className = 'off';
        sections[f].card.style.display = 'none';
      }
    }
  }
  
  // recursively build section from data
  function generateSection(data, element) {
    const div = document.createElement('div');
    div.className = 'guess-group';
    element.appendChild(div);
    
    if(data.guessMap) {
      const keys = Object.keys(data.guessMap);
      keys.sort((a, b)=>{
        const aValue = parseInt(a.replace(/C/g, '2').replace(/P/g, '1').replace(/_/g, '0'));
        const bValue = parseInt(b.replace(/C/g, '2').replace(/P/g, '1').replace(/_/g, '0'));
        return bValue - aValue;
      });
      
      for(let k = 0; k < keys.length; ++k) {
        const key = keys[k];
        const guessdiv = document.createElement('div');
        guessdiv.className = 'guess-result';
        div.appendChild(guessdiv);
        guessdiv.appendChild(genGuessWord(data.guess, key));
        if(key === CORRECT) {
          // nothing
        } else {
          guessdiv.appendChild(genGuessArrow());
          if(data.guessMap[key].answerCount === 1) {
            const collapsedWord = genGuessWord(data.guessMap[key].guess);
            collapsedWord.className = 'guess-word guess-word-collapsed';
            guessdiv.appendChild(collapsedWord);
          } else {
            guessdiv.className = 'guess-result guess-result-extended';
            generateSection(data.guessMap[key], guessdiv);
          }
        }
      }
    }
  }
  
  // generate guess word element
  function genGuessWord(word, key) {
    const guessWordDiv = document.createElement('div');
    guessWordDiv.className = 'guess-word';
    for(let c = 0; c < WSIZE; ++c) {
      const guessCharSpan = document.createElement('span');
      guessWordDiv.appendChild(guessCharSpan);
      
      guessCharSpan.textContent = word[c];
      if(key) {
        guessCharSpan.className = 'guess-char guess-char-'+key[c];
      } else {
        guessCharSpan.className = 'guess-char';
      }
    }
    return guessWordDiv;
  }
  
  // generate arrow
  function genGuessArrow() {
    const guessArrowDiv = document.createElement('div');
    guessArrowDiv.className = 'guess-arrow';
    guessArrowDiv.textContent = '➔';
    return guessArrowDiv;
  }
  
  // add footer
  function addFooter() {
    const p = document.createElement('p');
    p.className = 'note';
    document.body.appendChild(p);
    
    p.appendChild(document.createTextNode('Data from: '));
    const a = document.createElement('a');
    a.href = REF;
    a.textContent = REF;
    p.appendChild(a);    
  }
  
  // Load sequence
  Promise.all([
    Promise.all(dataFiles.map(f=>loadDataFile(f))),
    waitDOM()
  ]).then(buildUI).then(countDown).then(hideStopper);

})();
