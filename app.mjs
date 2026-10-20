import { chapters, questions } from './bank.mjs';
import { LETTERS, drawRound, allowsMultiple, gradeRound } from './quiz.mjs';

const $app = document.querySelector('#app');
const chapterById = Object.fromEntries(chapters.map(c => [c.id, c]));
const state = { view: 'home', chapter: null, round: [], selections: [], index: 0, results: null, hint: '', search: '' };
const STORAGE_KEY = 'asia-mental-nursing-practice-v1';
const icon = (name) => {
  const paths = {
    arrow: '<path d="M4 10h12M11 5l5 5-5 5"/>',
    back: '<path d="M16 10H4m5-5-5 5 5 5"/>',
    book: '<path d="M10 5C7 3 4 3 2 4v12c3-1 5-1 8 1 3-2 5-2 8-1V4c-2-1-5-1-8 1Zm0 0v12"/>',
    check: '<path d="m4 10 4 4 8-8"/>',
    close: '<path d="m5 5 10 10M15 5 5 15"/>',
    search: '<circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4 4"/>',
    shield: '<path d="M10 2 3 5v5c0 4 4 6 7 8 3-2 7-4 7-8V5l-7-3Z"/><path d="m6 10 3 3 5-6"/>',
    external: '<path d="M12 3h5v5m0-5-8 8M8 4H4v12h12v-4"/>',
    repeat: '<path d="M16 7a6 6 0 1 0 0 7M16 3v5h-5"/>'
  };
  return `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.book}</svg>`;
};
const esc = (text) => String(text ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const sourceLabel = q => `${q.year}年${q.examLabel || ['','第一次','第二次','第三次'][q.nth]}・第${q.num}題`;
function readHistory() {
  try {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(history)) return [];
    return history.filter(r => chapterById[r.chapter] && Number.isInteger(r.correct) && r.correct >= 0 && r.correct <= 5 && Number.isFinite(r.at)).slice(0, 100);
  } catch { return []; }
}
function saveResult(correct) {
  try {
    const history = readHistory();
    history.unshift({ chapter: state.chapter, correct, at: Date.now() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 100)));
    return true;
  } catch { return false; }
}
function header() {
  return `<header class="site-header"><div class="shell header-inner">
    <button class="brand" data-action="home" aria-label="回精神衛生護理練習首頁"><span class="brand-mark" aria-hidden="true">AU</span><span><strong>亞洲大學 學士後護理學系</strong><small>MENTAL HEALTH NURSING</small></span></button>
    <nav class="top-nav" aria-label="主要導覽"><button class="nav-button ${state.view !== 'history' ? 'active' : ''}" data-action="home">單元練習</button><button class="nav-button ${state.view === 'history' ? 'active' : ''}" data-action="history">我的紀錄</button></nav>
  </div></header>`;
}
function footer() {
  return `<footer class="site-footer"><div class="shell footer-inner"><details><summary>題庫來源與練習說明</summary><p>題目來源：考選部公開之護理師國考「精神科與社區衛生護理學」，106–115年共24份試卷、863題。依課程16類單元整理，答案已套用官方更正；歷年法規與政策題依當次試卷及官方答案呈現。資料核對日期：115年10月20日。115年第三次尚未收錄。10題飲食障礙症納入CH22延伸題。</p><p>本網站提供自主練習，不蒐集姓名或學號。練習紀錄只儲存在目前瀏覽器，最多保留100回；清除瀏覽器資料後紀錄會一併清除。此網站為課程練習工具。</p><p>考選部網站引用宣示：本網站資料，歡迎朋友連結使用。但引用時，請註明資料來源並請確保資料之完整（包括本項宣示在內），均不得任意增刪</p><p><a href="https://wwwq.moex.gov.tw/exam/wFrmExamQandASearch.aspx" target="_blank" rel="noopener noreferrer">前往考選部考畢試題查詢平臺 ${icon('external')}</a></p></details><div class="footer-right">一步一題，穩穩前進。</div></div></footer>`;
}
function unitCards() {
  const needle = state.search.trim().toLowerCase().replace(/\s/g, '');
  const filtered = chapters.filter(c => `${c.code}${c.title}${c.subtitle}`.toLowerCase().replace(/\s/g, '').includes(needle));
  if (!filtered.length) return '<div class="empty">找不到符合的單元，試試章節編號或主題名稱。</div>';
  return filtered.map(c => `<article class="unit-card"><div class="unit-card-top"><span class="chapter-code">${esc(c.code)}</span><span class="unit-number">${String(chapters.indexOf(c) + 1).padStart(2,'0')}</span></div><h3>${esc(c.displayTitle)}</h3>${c.subtitle ? `<p class="unit-subtitle">${esc(c.subtitle)}</p>` : ''}<div class="unit-meta"><span>${c.count}題</span><span>${c.years.length}個年份</span>${c.id === 'O' ? '<span>含延伸題</span>' : ''}</div><div class="card-bottom"><small>同一單元 · 五年五題</small><button class="text-button" data-action="start" data-chapter="${c.id}" aria-label="開始${esc(c.displayTitle)}五題練習">開始練習 ${icon('arrow')}</button></div></article>`).join('');
}
function home() {
  return `<main id="main" class="shell"><section class="hero"><div><div class="eyebrow">國考準備，從一個單元開始</div><h1>精神衛生護理學<br>每次五題，累積你的把握。</h1><p>選擇課程單元，以<em>不同年份的國考原題</em>練習。<br>完成整回再對答案，讓每一次練習都有收穫。</p><div class="stats"><div class="stat"><strong>863</strong><small>國考原題</small></div><div class="stat"><strong>16</strong><small>課程單元</small></div><div class="stat"><strong>106–115</strong><small>民國年度</small></div></div></div><aside class="routine" aria-label="每回練習規則"><div class="routine-top"><span>給自己一小段專注時間</span>${icon('book')}</div><div class="large-five">5<small>題，一回練習</small></div><div class="routine-bottom"><span>同一單元 · 五個不同年份</span><span class="dots" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span></div></aside></section>
    <div class="intro-line">${icon('shield')}<span>練習期間不揭曉答案。完成5題並送出後，即可查看成績、正確答案與官方更正說明。</span></div>
    <details class="install-guide"><summary><span>加入 iPhone 主畫面</span><small>隨時開啟，像 App 一樣練習</small></summary><div class="install-body"><ol><li>用 iPhone 的 <strong>Safari</strong> 開啟本網站。</li><li>點選「分享」按鈕，再選擇<strong>「加入主畫面」</strong>。</li><li>若出現「以網頁 App 打開」，請開啟此選項，再點<strong>「加入」</strong>。</li></ol><p>主畫面會出現「精神護理國考」圖示。首次請連網開啟，等頁尾顯示「已可離線練習」後，即可離線刷題。原始試題連結需要網路；練習紀錄只保存在目前 App 或瀏覽器中。</p></div></details>
    <section aria-labelledby="units-title"><div class="section-top"><div><h2 id="units-title">今天，想練習哪個單元？</h2><p>依課程章節選擇，每回隨機抽出5個不同年份的題目。</p></div><label class="search">${icon('search')}<span class="visually-hidden">搜尋章節或單元</span><input id="unit-search" type="search" placeholder="搜尋章節或單元" value="${esc(state.search)}" autocomplete="off"></label></div><div id="unit-grid" class="unit-grid">${unitCards()}</div></section></main>`;
}
function context(q) {
  if (!q.context) return '';
  return `<aside class="context"><strong>${esc(q.context.label || '前題情境')} · ${q.year}年${q.examLabel || ['','第一次','第二次','第三次'][q.nth]}第${q.context.num}題</strong>${esc(q.context.stem)}</aside>`;
}
function quiz() {
  const c = chapterById[state.chapter], q = state.round[state.index];
  const completed = state.selections.filter(s => s.length).length;
  const multi = allowsMultiple(q);
  return `<main id="main" class="shell"><div class="breadcrumb"><button data-action="home">單元練習</button><span>/</span><span class="current">本回練習</span></div><div class="quiz-title-row"><div><span class="chapter-code">${esc(c.code)}</span><h1>${esc(c.displayTitle)}</h1><p>五題來自五個不同年份。答案可修改，送出後再一起對照。</p></div><span class="round-badge">同單元 · 5個年份 · 5題</span></div><div class="quiz-layout"><section class="question-panel" aria-label="作答區"><div class="question-top"><span class="question-index"><strong>${String(state.index+1).padStart(2,'0')}</strong> / 05</span><span class="source-tag">${sourceLabel(q)}</span></div>${context(q)}${q.extension ? '<p class="question-note">CH22 飲食障礙症延伸題</p>' : ''}<h2 id="question-stem" class="question-stem" tabindex="-1">${esc(q.stem)}</h2>${multi ? '<p class="question-note">此題依官方更正採複數給分，可選一個或多個選項。</p>' : ''}<fieldset class="options"><legend>${multi ? '選擇一個或多個答案' : '選擇一個答案'}</legend>${q.options.map((opt,i) => {
      const letter = LETTERS[i], selected = state.selections[state.index].includes(letter);
      return `<label class="option ${selected ? 'selected' : ''}"><input type="${multi ? 'checkbox' : 'radio'}" name="answer-${state.index}" value="${letter}" ${selected ? 'checked' : ''} data-option="${letter}"><span class="option-letter">${letter}</span><span class="option-copy">${esc(opt)}</span><span class="option-check">${icon('check')}</span></label>`;
    }).join('')}</fieldset><p id="answer-status" class="visually-hidden" aria-live="polite"></p>${state.hint ? `<p class="hint" role="alert">${esc(state.hint)}</p>` : ''}<div class="question-actions"><button class="secondary" data-action="prev" ${state.index===0?'disabled':''}>${icon('back')} 上一題</button>${state.index < 4 ? `<button class="primary" data-action="next">下一題 ${icon('arrow')}</button>` : `<button class="primary" data-action="submit">送出5題 ${icon('check')}</button>`}</div></section><aside class="round-sidebar"><div class="side-card"><h2>本回作答進度</h2><div class="step-buttons">${state.round.map((_,i) => `<button class="step ${state.index===i?'active':''} ${state.selections[i].length?'done':''}" data-action="jump" data-index="${i}" ${state.index===i?'aria-current="step"':''} aria-label="第${i+1}題${state.selections[i].length?'，已作答':'，尚未作答'}">${i+1}</button>`).join('')}</div><p class="side-progress" id="side-progress">已完成 ${completed} / 5 題</p><div class="progress-track" aria-hidden="true"><span id="progress-fill" style="width:${completed*20}%"></span></div><div class="year-list">${state.round.map(q=>`<span>${q.year}年</span>`).join('')}</div><p class="side-rule">可點選題號切換題目。<br>全部作答後按「送出5題」，才會顯示答案。</p></div><p class="side-footnote">以國考原題練習，保留原題號與選項順序。請依題目當年的情境作答。</p></aside></div></main>`;
}
function reviewCard(result,index) {
  const { question:q, chosen, correct, accepted, allCredit } = result;
  const correctLetters = allCredit ? [] : [...new Set(accepted.join('').split(''))];
  return `<article class="review-card"><div class="review-top"><strong>${String(index+1).padStart(2,'0')}　${sourceLabel(q)}</strong><span class="verdict ${correct?'':'wrong'}">${icon(correct?'check':'close')}${allCredit?'依官方給分':correct?'答對了':'再熟悉一下'}</span></div>${context(q)}${q.extension?'<p class="question-note">CH22 飲食障礙症延伸題</p>':''}<h3 class="question-stem">${esc(q.stem)}</h3>${q.options.map((option,i)=>{const letter=LETTERS[i],good=correctLetters.includes(letter),bad=chosen.includes(letter)&&!correct&&!good;return `<div class="review-option ${good?'good':bad?'bad':''}"><span class="letter">${letter}</span><span class="copy">${esc(option)}</span><small>${chosen.includes(letter)?'你的選擇':''}${good?`${chosen.includes(letter)?' · ':''}正確選項`:''}</small></div>`;}).join('')}<div class="answer-summary"><span>你的答案 <strong>${chosen.join('、')}</strong></span><span>${allCredit?'官方給分':'正確答案'} <strong>${esc(q.answer)}</strong></span></div>${q.correction?`<p class="official-note">官方更正：${esc(q.correction)}</p>`:''}<a class="source-link" href="${esc(q.source)}" target="_blank" rel="noopener noreferrer">查看考選部原始試題與答案 ${icon('external')}</a></article>`;
}
function results() {
  const c = chapterById[state.chapter], score=state.results.filter(r=>r.correct).length;
  return `<main id="main" class="shell"><div class="breadcrumb"><button data-action="home">單元練習</button><span>/</span><span class="current">練習結果</span></div><section class="result-hero"><div><div class="eyebrow">本回練習完成</div><h1>${score===5?'五題完成，繼續累積把握。':'把不熟悉的地方，再練穩一點。'}</h1><p>${esc(c.code)} · ${esc(c.displayTitle)}<br>已完成5個不同年份的國考原題</p></div><div class="score"><strong>${score}</strong><span> / 5</span><small>本回答對題數</small></div></section><div class="result-top-actions"><button class="primary" data-action="start" data-chapter="${c.id}">${icon('repeat')} 同單元再練5題</button><button class="secondary" data-action="home">選擇其他單元</button></div>${state.hint?`<p class="hint" role="status">${esc(state.hint)}</p>`:''}<h2 class="review-heading">逐題對照</h2>${state.results.map(reviewCard).join('')}<div class="review-footer"><button class="primary" data-action="start" data-chapter="${c.id}">同單元再練5題 ${icon('arrow')}</button><button class="secondary" data-action="home">回到單元列表</button></div></main>`;
}
function history() {
  const records=readHistory(), totalCorrect=records.reduce((sum,r)=>sum+r.correct,0);
  return `<main id="main" class="shell"><section class="record-intro"><div class="eyebrow">看見自己的每一小步</div><h1>我的練習紀錄</h1><p>紀錄僅保存在目前瀏覽器，最多保留最近100回練習。</p></section><div class="record-stats"><div class="record-stat"><strong>${records.length}</strong><small>已完成練習回數</small></div><div class="record-stat"><strong>${new Set(records.map(r=>r.chapter)).size} / 16</strong><small>已練習單元</small></div><div class="record-stat"><strong>${records.length?Math.round(totalCorrect/(records.length*5)*100):0}%</strong><small>累計答對率</small></div></div>${records.length?`<section class="record-list" aria-label="最近練習紀錄">${records.map(r=>`<article class="record-item"><div><h2>${esc(chapterById[r.chapter].displayTitle)}</h2><p>${esc(chapterById[r.chapter].code)} · ${new Date(r.at).toLocaleString('zh-TW',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})} · 5個年份</p></div><span class="record-score">${r.correct}<small> / 5</small></span></article>`).join('')}</section>`:`<div class="empty"><p>還沒有練習紀錄。從一個單元、五道題目開始吧。</p><button class="primary" data-action="home">選擇單元 ${icon('arrow')}</button></div><div style="height:40px"></div>`}</main>`;
}
function render(focus=false) {
  $app.innerHTML = header() + ({home,quiz,results,history}[state.view]()) + footer();
  if (focus) { window.scrollTo({top:0,behavior:'instant'}); document.querySelector('#question-stem')?.focus({preventScroll:true}); }
  document.title = state.view === 'quiz' ? `${chapterById[state.chapter].displayTitle}・第${state.index+1}題｜精神衛生護理國考練習` : '精神衛生護理學｜亞洲大學學士後護理國考練習';
}
function start(chapter) {
  try {
    state.round=drawRound(questions,chapter); state.chapter=chapter;
    state.selections=Array.from({length:5},()=>[]); state.index=0; state.results=null; state.hint='';state.view='quiz'; render(true);
  } catch(error) { alert(error.message); }
}
$app.addEventListener('click',event=>{
  const control=event.target.closest('[data-action]'); if(!control || control.disabled)return;
  const action=control.dataset.action;
  if(action==='home'||action==='history'){state.view=action;state.hint='';render(true);}
  if(action==='start')start(control.dataset.chapter);
  if(action==='next'||action==='prev'||action==='jump'){
    state.index=action==='jump'?Number(control.dataset.index):Math.max(0,Math.min(4,state.index+(action==='next'?1:-1)));state.hint='';render(true);
  }
  if(action==='submit'){
    const missing=state.selections.findIndex(s=>!s.length);
    if(missing>=0){state.index=missing;state.hint='還有題目尚未作答，請完成全部5題再送出。';render(true);return;}
    try{state.results=gradeRound(state.round,state.selections);state.view='results';state.hint=saveResult(state.results.filter(r=>r.correct).length)?'':'本回已完成；目前瀏覽器無法儲存練習紀錄。';render(true);}catch(error){state.hint=error.message;render();}
  }
});
$app.addEventListener('change',event=>{
  const input=event.target.closest('[data-option]'); if(!input||state.view!=='quiz')return;
  const q=state.round[state.index];
  if(allowsMultiple(q)){state.selections[state.index]=[...document.querySelectorAll('.options input:checked')].map(el=>el.value);}else state.selections[state.index]=[input.value];
  document.querySelectorAll('.option').forEach(label=>label.classList.toggle('selected',label.querySelector('input').checked));
  const completed=state.selections.filter(s=>s.length).length;
  document.querySelector('#side-progress').textContent=`已完成 ${completed} / 5 題`;
  document.querySelector('#progress-fill').style.width=`${completed*20}%`;
  document.querySelector('#answer-status').textContent=`第${state.index+1}題已選擇${state.selections[state.index].join('、')}`;
  document.querySelectorAll('.step').forEach((step,i)=>{step.classList.toggle('done',!!state.selections[i].length);step.setAttribute('aria-label',`第${i+1}題，${state.selections[i].length?'已作答':'尚未作答'}`);});
  state.hint=''; document.querySelector('.hint')?.remove();
});
$app.addEventListener('input',event=>{
  if(event.target.id==='unit-search'){state.search=event.target.value;document.querySelector('#unit-grid').innerHTML=unitCards();}
});
render();
