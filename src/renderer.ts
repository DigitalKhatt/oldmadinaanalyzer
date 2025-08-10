/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/latest/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import sqlite3 from 'sqlite3';
import './index.css';
import fs from 'fs';
import path from 'path'

interface WordsRow {
  page: number,
  line: number,
  qpc_v1: string,
  dk_v1: string,
  bases: string,
}


function addfontfamilies() {
  const foldePath = "./fonts/"
  var newStyle = document.createElement('style');
  for (let pageNumber = 1; pageNumber <= 604; pageNumber++) {
    const filename = `${foldePath}QCF_P${String(pageNumber).padStart(3, '0')}.ttf`

    newStyle.appendChild(document.createTextNode("\
    @font-face {\
        font-family: " + `'QCF_P${pageNumber}'` + ";\
        src: url('" + filename + "');\
    }\
    "));
  }

  document.head.appendChild(newStyle);
}

//addfontfamilies()



let db: sqlite3.Database;
let rows: WordsRow[] = require('./quran.json')

const inputSearch = document.getElementById("inputSearch") as HTMLInputElement;
const resultBody = document.getElementById("resultBody") as HTMLTableElement;
const table = document.getElementById("result") as HTMLTableElement;
const quranSearch = document.getElementById('quranSearch')
const saveQuran = document.getElementById('saveQuran')
const checkMarks = document.getElementById('marks') as HTMLInputElement
const checkClasses = document.getElementById('classes') as HTMLInputElement
const nbResult = document.getElementById('nbResult') as HTMLInputElement
const checkIsol = document.getElementById('isol') as HTMLInputElement
const checkInit = document.getElementById('init') as HTMLInputElement
const checkMedi = document.getElementById('medi') as HTMLInputElement
const checkFina = document.getElementById('fina') as HTMLInputElement

const alefClass = "اآٱأإ"
const hahClass = "جحخ"
const dalClass = "دذ"
const rehClass = "رز"
const seenClass = "سش"
const sadClass = "صض"
const tahClass = "طظ"
const ainClass = "عغ"
const behClass = "بتث"
const sennaInitMedi = "بتثنيئى"
const leftNoJoinLetters = 'ادذرزوؤأٱإءة';
const dualJoinLetters = 'بتثجحخسشصضطظعغفقكلمنهيئىـ';
const noJoinLetters = 'ء';
const allbases = leftNoJoinLetters + dualJoinLetters;

function searchResult(quran: WordsRow[]) {
  const result: WordsRow[] = [];
  let searchText = inputSearch.value;
  const useMarks = checkMarks.checked
  const useClasses = checkClasses.checked
  if (!searchText) {
    updateResult(quran)
    return;
  }
  if (!useMarks) {
    searchText = searchText.normalize("NFD").replace(/\p{Mark}|ـ/gu, "");
  }

  let newSearch = "";

  if (useClasses) {
    for (let i = 0; i < searchText.length; i++) {
      const currChar = searchText[i];
      if (alefClass.includes(currChar)) {
        newSearch += `[${alefClass}]`;
      } else if (seenClass.includes(currChar)) {
        newSearch += `[${seenClass}]`;
      } else if (hahClass.includes(currChar)) {
        newSearch += `[${hahClass}]`;
      } else if (dalClass.includes(currChar)) {
        newSearch += `[${dalClass}]`;
      } else if (rehClass.includes(currChar)) {
        newSearch += `[${rehClass}]`;
      } else if (sadClass.includes(currChar)) {
        newSearch += `[${sadClass}]`;
      } else if (tahClass.includes(currChar)) {
        newSearch += `[${tahClass}]`;
      } else if (ainClass.includes(currChar)) {
        newSearch += `[${ainClass}]`;
      } else if (behClass.includes(currChar)) {
        newSearch += `(?:[${sennaInitMedi}](?=[${allbases}])|(?:[${behClass}]))`;
      } else {
        newSearch += currChar;
      }
    }
  } else {
    newSearch = searchText;
  }

  let finaPattern = newSearch;

  if(!useMarks && (checkIsol.checked || checkInit.checked || checkMedi.checked || checkFina.checked)){
    let lookBehindIsol = "";
    let lookAheadIsol = "";
    let lookBehindInit = "";
    let lookAheadInit = "";
    let lookBehindMedi = "";
    let lookAheadMedi = "";
    let lookBehindFina = "";
    let lookAheadFina = "";
    let isolSearch = "";
    let initSearch = "";
    let mediSearch = "";
    let finaSearch = "";
    if(checkIsol.checked){
        lookBehindIsol = `(?<=^|[${leftNoJoinLetters}])`;
        const stext = searchText.normalize("NFD").replace(/\p{Mark}|ـ/gu, "").slice(-1);
        if(!leftNoJoinLetters.includes(stext)){
          lookAheadIsol = `(?=$|[${noJoinLetters}])`;
        }
        isolSearch = `${lookBehindIsol}${newSearch}${lookAheadIsol}`;
      }

      if(checkInit.checked){
        const stext = searchText.normalize("NFD").replace(/\p{Mark}|ـ/gu, "").slice(-1);
        if(!leftNoJoinLetters.includes(stext)){
          lookBehindInit = `(?<=^|[${leftNoJoinLetters}])`;
          lookAheadInit = `(?=$|[${allbases}])`;
          initSearch = `${lookBehindInit}${newSearch}${lookAheadInit}`;
        }
      }

      if(checkMedi.checked){
        const stext = searchText.normalize("NFD").replace(/\p{Mark}|ـ/gu, "").slice(-1);
        if(!leftNoJoinLetters.includes(stext)){
          lookBehindMedi = `(?<=[${dualJoinLetters}])`;
          lookAheadMedi = `(?=[${allbases}])`;
          mediSearch = `${lookBehindMedi}${newSearch}${lookAheadMedi}`;
        }    
      }

      if(checkFina.checked){
        const stext = searchText.normalize("NFD").replace(/\p{Mark}|ـ/gu, "").slice(-1);
        if(!noJoinLetters.includes(stext)){
          if(!leftNoJoinLetters.includes(stext)){
            lookAheadFina = `(?=$)`;
          }
          lookBehindFina = `(?<=[${dualJoinLetters}])`;      
          finaSearch = `${lookBehindFina}${newSearch}${lookAheadFina}`;
        }    
      }

      finaPattern = [isolSearch, initSearch, mediSearch, finaSearch].filter(Boolean).join("|"); 
  }

  
  
  if(finaPattern){
    const re = new RegExp(finaPattern, "u");
    for (let row of quran) {
      const text = useMarks ? row.dk_v1 : row.bases;
      if (text.match(re)) {
        result.push(row);
      }
    }
  }

  updateResult(result)
}

function updateResult(result: WordsRow[]) {
  const t1 = performance.now();
  resultBody.replaceChildren();
  //const tbody = document.createElement('tbody');
  result.forEach((row) => {
    const tr = document.createElement('tr');
    let page = tr.insertCell(0);
    page.innerHTML = row.page.toString();
    let line = tr.insertCell(1);
    line.innerHTML = row.line.toString();
    let dk_v1 = tr.insertCell(2);
    dk_v1.innerHTML = row.dk_v1;
    let qpc_v1 = tr.insertCell(3);
    qpc_v1.innerHTML = row.qpc_v1;
    qpc_v1.style.fontFamily = `QCF_P${row.page}`;
    resultBody.appendChild(tr);

  })
  console.log(`render in ${performance.now() - t1}`)
  nbResult.innerText = `${result.length} words found`
}

function replaceQuran(data: WordsRow[]) {

  for (let row of data) {
    row.bases = row.dk_v1.normalize("NFD").replace(/\p{Mark}|ـ/gu, "");
  }

  return data;
}

const init = async () => {
  const win = window as any;
  //const buffer = await win.filesystem.loadfont()
  const appPath = await win.filesystem.getAppPath()
  //const font = parse(buffer);
  //console.log(font) // prints out 'pong'

  const dbPath = path.join(appPath, "quran-data.sqlite");

  db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY)

  quranSearch.addEventListener('click', function (e) {
    searchResult(rows)
  })

  saveQuran.addEventListener('click', function (e) {
    const t0 = performance.now();
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY)

    db.all<WordsRow>("select l.page,l.line,w.qpc_v1,w.dk_v1 from words w INNER JOIN qpc_v1_layout l ON l.type = 'ayah' AND l.range_start <= w.word_number_all AND l.range_end >= w.word_number_all;", (error, newrows) => {
      rows = replaceQuran(newrows);
      const jsonPath = path.join(appPath, "src", "quran.json");
      try {
        fs.writeFileSync(jsonPath, JSON.stringify(rows));
      } catch (err) {
        console.error(err);
      }
      console.log(`${rows.length} words read in ${performance.now() - t0}`)
      db.close();
    });
  })

}

init()

