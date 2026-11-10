export const emptyState = () => ({version: 1, attempts: [], drafts: {}, lessons: {}, selected: '1-1', updated: 0});
export function latest(state, lessonId, task) { return state.attempts.filter(a => a.lessonId === lessonId && a.task === task).at(-1); }
export function passed(state, lessonId, task) { return (latest(state, lessonId, task)?.result.score ?? -1) >= 8; }
export function complete(state, lessonId) { return [0,1,2,3].every(task => passed(state, lessonId, task)); }
export function unlocked(state, catalog, index) { return index === 0 || complete(state, catalog[index - 1].id); }
export function currentTask(state, lessonId) { const n = [0,1,2,3].find(task => !passed(state, lessonId, task)); return n ?? 3; }
export function learningProfile(state) {
  const recent=state.attempts.slice(-12);
  return {recentAverage:recent.length?Math.round(recent.reduce((sum,a)=>sum+a.result.score,0)/recent.length*10)/10:null, recoveryCount:recent.filter(a=>a.result.score<8).length, reviewPoints:[...new Set(recent.flatMap(a=>a.result.review))].slice(-6)};
}
export function mergeStates(a, b) {
  const result = emptyState();
  result.attempts = [...new Map([...a.attempts, ...b.attempts].map(x => [x.id, x])).values()].sort((x,y) => x.time-y.time);
  result.lessons = {...a.lessons, ...b.lessons};
  for (const key of new Set([...Object.keys(a.drafts), ...Object.keys(b.drafts)])) {
    result.drafts[key] = (a.drafts[key]?.time ?? 0) > (b.drafts[key]?.time ?? 0) ? a.drafts[key] : b.drafts[key];
  }
  result.selected = a.updated > b.updated ? a.selected : b.selected;
  result.updated = Math.max(a.updated, b.updated);
  return result;
}
