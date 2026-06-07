import { useCallback } from 'react';
import { useStreakTimer } from '@/hooks/useStreakTimer';
import { useUserName } from '@/hooks/useUserName';
import { useCustomStats } from '@/hooks/useCustomStats';
import { useDailyCheckin } from '@/hooks/useDailyCheckin';

// ─── Rank system (mirror of Goals.tsx) ──────────────────────
const TIERS = [
  { name: 'Bronze',        color: '#CD7F32', badge: '🥉', minDays: 0 },
  { name: 'Silver',        color: '#A8A8A8', badge: '🥈', minDays: 10 },
  { name: 'Gold',          color: '#DAA520', badge: '🥇', minDays: 30 },
  { name: 'Platinum',      color: '#4FC3F7', badge: '💎', minDays: 60 },
  { name: 'Diamond',       color: '#00E5FF', badge: '💠', minDays: 100 },
  { name: 'Crown',         color: '#CE93D8', badge: '👑', minDays: 180 },
  { name: 'Ace',           color: '#34D399', badge: '🃏', minDays: 365 },
  { name: 'Ace Dominator', color: '#F87171', badge: '🔥', minDays: 450 },
  { name: 'Ace Master',    color: '#FDE68A', badge: '⚔️', minDays: 540 },
];
const DIVISIONS = ['V', 'IV', 'III', 'II', 'I'] as const;
const RANK_XP_STARTS = [
  0,500,1000,1500,2000,2500,3100,3700,4500,5500,
  7000,8000,9200,10500,12000,14000,15500,17000,19000,21000,
  23000,25000,27000,29000,31000,34000,35500,37000,38500,40000,
  42000,43000,44000,45000,46000,46500,47000,47500,48000,48500,
  49000,49200,49400,49600,49800,50000,
];

const XP_CFG = { SMOKE_FREE: 40, GYM: 20, CRAVING: 3, CHECKIN: 10, SMOKED: 10 };

function getRank(xp: number, days: number) {
  const ranks: { name: string; division: string; tierIdx: number; xpStart: number; color: string; badge: string }[] = [];
  for (let t = 0; t < TIERS.length; t++) {
    for (let d = 0; d < 5; d++) {
      ranks.push({
        name: TIERS[t].name,
        division: DIVISIONS[d],
        tierIdx: t,
        xpStart: RANK_XP_STARTS[t * 5 + d],
        color: TIERS[t].color,
        badge: TIERS[t].badge,
      });
    }
  }
  ranks.push({ name: 'Conqueror', division: '', tierIdx: -1, xpStart: 50000, color: '#FFD700', badge: '🏆' });

  const clamped = Math.max(0, xp);
  const rank = [...ranks].reverse().find(r => clamped >= r.xpStart && days >= (r.tierIdx >= 0 ? TIERS[r.tierIdx].minDays : 730)) || ranks[0];
  return rank;
}

function getTotalsFromStorage() {
  try {
    const raw = localStorage.getItem('rebirth_daily_scores');
    if (!raw) return { gym: 0, cravings: 0, smoked: 0 };
    const history: Record<string, { gym?: number; cravings?: number; smoked?: number }> = JSON.parse(raw);
    return Object.values(history).reduce(
      (a, d) => ({ gym: a.gym + (d.gym || 0), cravings: a.cravings + (d.cravings || 0), smoked: a.smoked + (d.smoked || 0) }),
      { gym: 0, cravings: 0, smoked: 0 }
    );
  } catch { return { gym: 0, cravings: 0, smoked: 0 }; }
}

// ─── Canvas drawing ─────────────────────────────────────────
function drawSnapshot(
  userName: string,
  days: number,
  hours: number,
  minutes: number,
  totalXP: number,
  rankLabel: string,
  rankBadge: string,
  rankColor: string,
  cravingsDefeated: number,
  moneySaved: number,
  gymSessions: number,
  quitDate: string,
) {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0a0f1c');
  bg.addColorStop(0.5, '#111827');
  bg.addColorStop(1, '#0a0f1c');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Subtle grid pattern
  ctx.strokeStyle = 'rgba(255,255,255,0.015)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // Glow circles
  const drawGlow = (x: number, y: number, r: number, color: string) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  drawGlow(540, 350, 300, `${rankColor}15`);
  drawGlow(200, 900, 250, 'rgba(16,185,129,0.06)');
  drawGlow(880, 800, 200, 'rgba(59,130,246,0.06)');

  // ── Header ──
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 42px system-ui, -apple-system, sans-serif';
  ctx.fillText('🔥 REBIRTH', W / 2, 80);

  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = '22px system-ui, sans-serif';
  ctx.fillText(userName ? `${userName}'s Journey` : 'My Journey', W / 2, 120);

  // ── Rank Badge (large centered) ──
  ctx.font = '100px system-ui, sans-serif';
  ctx.fillText(rankBadge, W / 2, 260);

  ctx.fillStyle = rankColor;
  ctx.font = 'bold 48px system-ui, sans-serif';
  ctx.fillText(rankLabel, W / 2, 330);

  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '24px system-ui, sans-serif';
  ctx.fillText(`${totalXP.toLocaleString()} XP`, W / 2, 370);

  // ── Streak Display ──
  const streakY = 470;

  // Streak card background
  const cardR = ctx.createLinearGradient(120, streakY - 60, 960, streakY + 100);
  cardR.addColorStop(0, 'rgba(255,255,255,0.04)');
  cardR.addColorStop(1, 'rgba(255,255,255,0.02)');
  roundRect(ctx, 120, streakY - 60, W - 240, 170, 24);
  ctx.fillStyle = cardR;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.stroke();

  const statX = [300, 540, 780];
  const statVals = [String(days), String(hours), String(minutes)];
  const statLabels = ['Days', 'Hours', 'Minutes'];
  const statColors = [rankColor, '#38bdf8', '#f59e0b'];

  statVals.forEach((v, i) => {
    ctx.fillStyle = statColors[i];
    ctx.font = 'bold 64px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(v, statX[i], streakY + 30);

    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '22px system-ui, sans-serif';
    ctx.fillText(statLabels[i], statX[i], streakY + 65);
  });

  // ── Stats Grid ──
  const gridY = 700;
  const stats = [
    { label: 'Cravings\nDefeated', value: String(cravingsDefeated), color: '#10b981' },
    { label: 'Money\nSaved', value: `₹${moneySaved.toLocaleString()}`, color: '#10b981' },
    { label: 'Gym\nSessions', value: String(gymSessions), color: '#3b82f6' },
    { label: 'Smoke-Free\nDays', value: String(days), color: rankColor },
  ];

  const cellW = 200;
  const cellH = 160;
  const gap = 40;
  const gridW = cellW * 2 + gap;
  const startX = (W - gridW) / 2;

  stats.forEach((s, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = startX + col * (cellW + gap);
    const y = gridY + row * (cellH + gap);

    // Cell background
    roundRect(ctx, x, y, cellW, cellH, 20);
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fill();
    ctx.strokeStyle = `${s.color}22`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Value
    ctx.textAlign = 'center';
    ctx.fillStyle = s.color;
    ctx.font = 'bold 40px system-ui, sans-serif';
    ctx.fillText(s.value, x + cellW / 2, y + 65);

    // Label (multiline)
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '18px system-ui, sans-serif';
    const lines = s.label.split('\n');
    lines.forEach((line, li) => {
      ctx.fillText(line, x + cellW / 2, y + 100 + li * 22);
    });
  });

  // ── Footer ──
  const footY = H - 100;

  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.font = '20px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Journey started ${quitDate}`, W / 2, footY);

  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillText(new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), W / 2, footY + 35);

  return canvas;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// ─── Hook ───────────────────────────────────────────────────
export function useProgressSnapshot() {
  const { streakData } = useStreakTimer();
  const { userName } = useUserName();
  const { customStats } = useCustomStats();
  const { checkins } = useDailyCheckin();

  const generateSnapshot = useCallback(() => {
    const totals = getTotalsFromStorage();
    const daysOnJourney = Math.max(0, Math.floor(
      (Date.now() - streakData.quitDate.getTime()) / (1000 * 60 * 60 * 24)
    ));

    // Calculate XP
    const smokeFreeXP = daysOnJourney * XP_CFG.SMOKE_FREE;
    const gymXP = totals.gym * XP_CFG.GYM;
    const cravingXP = totals.cravings * XP_CFG.CRAVING;
    const checkinXP = checkins.filter(c => c.checkedIn).length * XP_CFG.CHECKIN;
    const smokedPenalty = totals.smoked * XP_CFG.SMOKED;
    const totalXP = Math.max(0, smokeFreeXP + gymXP + cravingXP + checkinXP - smokedPenalty);

    const rank = getRank(totalXP, daysOnJourney);
    const rankLabel = rank.division ? `${rank.name} ${rank.division}` : rank.name;
    const moneySaved = totals.cravings * customStats.costPerCigarette;

    const quitDateStr = streakData.quitDate.toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });

    const canvas = drawSnapshot(
      userName,
      streakData.days,
      streakData.hours,
      streakData.minutes,
      totalXP,
      rankLabel,
      rank.badge,
      rank.color,
      totals.cravings,
      moneySaved,
      totals.gym,
      quitDateStr,
    );

    // Try Web Share API first (mobile), fallback to download
    canvas.toBlob((blob) => {
      if (!blob) return;

      const file = new File([blob], `rebirth-progress-${new Date().toISOString().slice(0, 10)}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        navigator.share({ files: [file] }).catch(() => {
          downloadBlob(blob);
        });
      } else {
        downloadBlob(blob);
      }
    }, 'image/png');
  }, [streakData, userName, customStats, checkins]);

  return { generateSnapshot };
}

function downloadBlob(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rebirth-progress-${new Date().toISOString().slice(0, 10)}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
