export const LETTERS = ['A', 'B', 'C', 'D'];

export function shuffled(values, random = Math.random) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function drawRound(bank, chapter, random = Math.random) {
  const pool = bank.filter(q => q.chapter === chapter);
  const years = [...new Set(pool.map(q => q.year))];
  if (years.length < 5) throw new Error('此單元的不同年份不足五年，無法開始本回練習。');
  return shuffled(years, random).slice(0, 5).map(year => {
    const candidates = pool.filter(q => q.year === year);
    return candidates[Math.floor(random() * candidates.length)];
  });
}

export function acceptedSelections(question) {
  if (question.answer === '一律給分') return null;
  return [...new Set((question.answer.match(/[ABCD]+/g) || []).map(s => [...new Set(s)].sort().join('')))];
}

export function allowsMultiple(question) {
  return (acceptedSelections(question) || []).some(s => s.length > 1);
}

export function gradeRound(round, selections) {
  if (round.length !== 5 || selections.length !== 5) throw new Error('每回必須為五題。');
  if (new Set(round.map(q => q.chapter)).size !== 1 || new Set(round.map(q => q.year)).size !== 5) {
    throw new Error('每回必須為同一單元的五個不同年份。');
  }
  return round.map((question, index) => {
    const chosen = [...new Set(selections[index])].sort();
    if (!chosen.length || chosen.some(v => !LETTERS.includes(v)) || (!allowsMultiple(question) && chosen.length !== 1)) {
      throw new Error('請先完成全部五題，再送出查看答案。');
    }
    const accepted = acceptedSelections(question);
    return { question, chosen, correct: accepted === null || accepted.includes(chosen.join('')), accepted, allCredit: accepted === null };
  });
}
