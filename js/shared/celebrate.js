/* ===========================================================
   celebrate.js — shows the progression notifications returned by
   store.reportGameResult() as a short sequence of toasts.
   Called by each game at the end of a round.
   =========================================================== */

import { toast, confetti } from './ui.js';
import { playStar } from './sound.js';

/**
 * @param {object} result  the object returned by reportGameResult()
 * @param {{refreshStars:Function}} topbar  optional topbar to refresh
 */
export function celebrateProgress(result, topbar) {
  if (!result) return;
  const msgs = [];
  if (result.leveledUp) msgs.push(`⬆️ Level ${result.leveledUp}! You levelled up!`);
  if (result.challengeDone) msgs.push(`🎯 Daily Challenge done! +${result.challengeReward} ⭐`);
  if (result.streakMilestone) msgs.push(`🔥 ${result.streakMilestone}-day streak! +${result.streakBonus} ⭐`);
  for (const a of (result.newAchievements || [])) {
    msgs.push(`🏆 ${a.emoji} ${a.name}! +${a.reward} ⭐`);
  }
  if (result.newSticker) msgs.push('🌟 New sticker for your album!');

  if (!msgs.length) return;

  // these stack after the game's own win popup; space them out
  const START = 1700;
  msgs.forEach((m, i) => setTimeout(() => toast(m), START + i * 2100));
  if (result.leveledUp || (result.newAchievements || []).length) {
    setTimeout(() => { confetti(50); playStar(); }, START);
  }
  if (topbar && topbar.refreshStars) setTimeout(() => topbar.refreshStars(), START);
}
