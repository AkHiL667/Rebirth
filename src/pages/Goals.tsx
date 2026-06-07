import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Swords, Plus, Minus, Check, Dumbbell, Shield, TrendingUp, TrendingDown, Cigarette, X, Flame } from 'lucide-react';
import { useStreakTimer } from '@/hooks/useStreakTimer';
import { useDailyCheckin } from '@/hooks/useDailyCheckin';
import { useCustomStats } from '@/hooks/useCustomStats';

// ─── Storage ────────────────────────────────────────────────
const STORAGE_KEY = 'rebirth_daily_scores';
const RANK_SEEN_KEY = 'rebirth_rank_seen';

interface DailyScore {
  gym: number;
  cravings: number;
  smoked: number;
}
type ScoreHistory = Record<string, DailyScore>;

// ─── Season Config ──────────────────────────────────────────
const SEASON_DAYS = 90;

// ─── XP Config ──────────────────────────────────────────────
const XP = {
  CHECKIN: 30,
  GYM: 40,
  CRAVING: 10,
  SMOKED: -10,
} as const;

// ─── Rank System (season-based, no day requirements) ────────
interface RankTier {
  name: string;
  color: string;
  colorTo: string;
  textColor: string;
  badge: string;
}

const TIERS: RankTier[] = [
  { name: 'Bronze',         color: '#CD7F32', colorTo: '#A0522D', textColor: '#CD7F32', badge: '🥉' },
  { name: 'Silver',         color: '#C0C0C0', colorTo: '#808080', textColor: '#A8A8A8', badge: '🥈' },
  { name: 'Gold',           color: '#FFD700', colorTo: '#DAA520', textColor: '#DAA520', badge: '🥇' },
  { name: 'Platinum',       color: '#4FC3F7', colorTo: '#0288D1', textColor: '#4FC3F7', badge: '💎' },
  { name: 'Diamond',        color: '#00E5FF', colorTo: '#00B8D4', textColor: '#00E5FF', badge: '💠' },
  { name: 'Crown',          color: '#9C27B0', colorTo: '#6A1B9A', textColor: '#CE93D8', badge: '👑' },
  { name: 'Ace',            color: '#10B981', colorTo: '#059669', textColor: '#34D399', badge: '🃏' },
  { name: 'Ace Dominator',  color: '#EF4444', colorTo: '#B91C1C', textColor: '#F87171', badge: '🔥' },
  { name: 'Ace Master',     color: '#1C1917', colorTo: '#DAA520', textColor: '#FDE68A', badge: '⚔️' },
];

const DIVISIONS = ['V', 'IV', 'III', 'II', 'I'] as const;

// XP thresholds — upscaling: lower tiers cheap, higher tiers expensive
// Balanced so an average player (check-in daily, gym 4×/week, 1 craving/day, 1 smoke/week)
// earns ~5550 XP over 90 days and barely reaches Conqueror
const RANK_XP_STARTS = [
  // Bronze V–I (tier spans 150 XP)
  0, 30, 60, 90, 120,
  // Silver V–I (tier spans 320 XP)
  150, 230, 310, 390, 470,
  // Gold V–I (tier spans 450 XP)
  550, 660, 770, 890, 1000,
  // Platinum V–I (tier spans 600 XP)
  1100, 1250, 1400, 1550, 1700,
  // Diamond V–I (tier spans 700 XP)
  1800, 1970, 2140, 2320, 2500,
  // Crown V–I (tier spans 770 XP)
  2650, 2840, 3030, 3220, 3420,
  // Ace V–I (tier spans 640 XP)
  3600, 3760, 3920, 4080, 4240,
  // Ace Dominator V–I (tier spans 480 XP)
  4400, 4520, 4640, 4760, 4880,
  // Ace Master V–I (tier spans 400 XP)
  5000, 5100, 5200, 5300, 5400,
  // Conqueror
  5500,
];

function buildRankTable() {
  const ranks: { name: string; division: string; xpStart: number; xpEnd: number; tierIdx: number }[] = [];
  for (let t = 0; t < TIERS.length; t++) {
    for (let d = 0; d < 5; d++) {
      const flatIdx = t * 5 + d;
      const xpStart = RANK_XP_STARTS[flatIdx];
      const xpEnd = RANK_XP_STARTS[flatIdx + 1];
      ranks.push({ name: TIERS[t].name, division: DIVISIONS[d], xpStart, xpEnd, tierIdx: t });
    }
  }
  ranks.push({ name: 'Conqueror', division: '', xpStart: 5500, xpEnd: Infinity, tierIdx: -1 });
  return ranks;
}
const RANK_TABLE = buildRankTable();

function getRankInfo(xp: number) {
  const clamped = Math.max(0, xp);
  const rank = [...RANK_TABLE].reverse().find(r => clamped >= r.xpStart) || RANK_TABLE[0];
  const idx = RANK_TABLE.indexOf(rank);
  const nextRank = idx < RANK_TABLE.length - 1 ? RANK_TABLE[idx + 1] : null;
  const xpInRank = clamped - rank.xpStart;
  const xpNeeded = rank.xpEnd === Infinity ? 1 : rank.xpEnd - rank.xpStart;
  const pct = rank.xpEnd === Infinity ? 100 : Math.min((xpInRank / xpNeeded) * 100, 100);
  return { rank, idx, nextRank, xpInRank, xpNeeded, pct };
}

// ─── Helper ─────────────────────────────────────────────────
const getToday = () => new Date().toISOString().split('T')[0];

const emptyDay: DailyScore = { gym: 0, cravings: 0, smoked: 0 };

// ─── Component ──────────────────────────────────────────────
const Score = () => {
  const { streakData } = useStreakTimer();
  const { todayCheckedIn, checkins } = useDailyCheckin();
  const { customStats } = useCustomStats();
  const [history, setHistory] = useState<ScoreHistory>({});
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpRank, setLevelUpRank] = useState('');
  const prevRankIdx = useRef<number | null>(null);

  const daysOnJourney = Math.max(0, Math.floor(
    (Date.now() - streakData.quitDate.getTime()) / (1000 * 60 * 60 * 24)
  ));

  // ─── Season Computation ───────────────────────────────
  const currentSeason = Math.floor(daysOnJourney / SEASON_DAYS) + 1;
  const dayInSeason = daysOnJourney % SEASON_DAYS;
  const daysLeftInSeason = SEASON_DAYS - dayInSeason;
  const seasonPct = (dayInSeason / SEASON_DAYS) * 100;

  // Season date range
  const seasonDates = useMemo(() => {
    const qd = streakData.quitDate.getTime();
    const startMs = qd + (currentSeason - 1) * SEASON_DAYS * 86400000;
    const endMs = qd + currentSeason * SEASON_DAYS * 86400000;
    const startStr = new Date(startMs).toISOString().split('T')[0];
    const endStr = new Date(endMs - 1).toISOString().split('T')[0];
    return { startStr, endStr };
  }, [streakData.quitDate, currentSeason]);

  // Load history
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  const today = getToday();
  const todayScore: DailyScore = { ...emptyDay, ...history[today] };

  const updateToday = useCallback((updated: DailyScore) => {
    setHistory(prev => {
      const next = { ...prev, [today]: updated };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [today]);

  const inc = (key: keyof DailyScore) =>
    updateToday({ ...todayScore, [key]: todayScore[key] + 1 });
  const dec = (key: keyof DailyScore) => {
    if (todayScore[key] > 0) updateToday({ ...todayScore, [key]: todayScore[key] - 1 });
  };

  // ─── Lifetime Totals (for counters) ───────────────────
  const totals = useMemo(() =>
    Object.values(history).reduce(
      (a, d) => ({ gym: a.gym + d.gym, cravings: a.cravings + (d.cravings || 0), smoked: a.smoked + (d.smoked || 0) }),
      { gym: 0, cravings: 0, smoked: 0 }
    ), [history]);

  // ─── Season Totals (for XP) ───────────────────────────
  const seasonTotals = useMemo(() => {
    const { startStr, endStr } = seasonDates;
    return Object.entries(history)
      .filter(([date]) => date >= startStr && date <= endStr)
      .reduce(
        (a, [, d]) => ({ gym: a.gym + d.gym, cravings: a.cravings + (d.cravings || 0), smoked: a.smoked + (d.smoked || 0) }),
        { gym: 0, cravings: 0, smoked: 0 }
      );
  }, [history, seasonDates]);

  const seasonCheckins = useMemo(() => {
    const { startStr, endStr } = seasonDates;
    return checkins.filter(c => c.checkedIn && c.date >= startStr && c.date <= endStr).length;
  }, [checkins, seasonDates]);

  // ─── Season XP ────────────────────────────────────────
  const seasonXP = useMemo(() => {
    const checkinXP = seasonCheckins * XP.CHECKIN;
    const gymXP = seasonTotals.gym * XP.GYM;
    const cravingXP = seasonTotals.cravings * XP.CRAVING;
    const smokedPenalty = seasonTotals.smoked * Math.abs(XP.SMOKED);
    return Math.max(0, checkinXP + gymXP + cravingXP - smokedPenalty);
  }, [seasonTotals, seasonCheckins]);

  const todayPositiveXP = useMemo(() => {
    let xp = todayScore.gym * XP.GYM + todayScore.cravings * XP.CRAVING;
    if (todayCheckedIn) xp += XP.CHECKIN;
    return xp;
  }, [todayCheckedIn, todayScore]);

  const todayNegativeXP = useMemo(() =>
    todayScore.smoked * Math.abs(XP.SMOKED)
  , [todayScore.smoked]);

  const todayNetXP = todayPositiveXP - todayNegativeXP;

  // ─── Rank (based on season XP only) ───────────────────
  const { rank, idx: rankIdx, nextRank, xpInRank, xpNeeded, pct: rankPct } = useMemo(
    () => getRankInfo(seasonXP), [seasonXP]
  );

  const tier = rank.tierIdx >= 0 ? TIERS[rank.tierIdx] : null;
  const isConqueror = rank.name === 'Conqueror';

  // Level-up detection
  useEffect(() => {
    if (prevRankIdx.current !== null && rankIdx > prevRankIdx.current) {
      const seenKey = RANK_SEEN_KEY;
      const seen = localStorage.getItem(seenKey);
      const label = rank.division ? `${rank.name} ${rank.division}` : rank.name;
      if (seen !== label) {
        setLevelUpRank(label);
        setShowLevelUp(true);
        localStorage.setItem(seenKey, label);
      }
    }
    prevRankIdx.current = rankIdx;
  }, [rankIdx, rank]);

  // ─── Missions ─────────────────────────────────────────
  const missions = [
    { label: 'Daily Check-in', done: todayCheckedIn, xp: XP.CHECKIN },
    { label: 'Gym Session', done: todayScore.gym > 0, xp: XP.GYM },
    { label: 'Defeat a Craving', done: todayScore.cravings > 0, xp: XP.CRAVING },
  ];
  const missionsDone = missions.filter(m => m.done).length;

  // ─── Recovery Stats ───────────────────────────────────
  const cigsAvoided = totals.cravings;
  const moneySaved = cigsAvoided * customStats.costPerCigarette;
  const hoursReclaimed = Math.round(cigsAvoided * 5 / 60);

  // ─── Bar Chart (last 14 days) ───────────────────────────
  const barChart = useMemo(() => {
    const days: { date: string; xp: number; label: string }[] = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const hasCheckin = checkins.some(c => c.date === ds && c.checkedIn);
      const dayData = history[ds];
      let xp = 0;
      if (hasCheckin) xp += XP.CHECKIN;
      if (dayData?.gym) xp += dayData.gym * XP.GYM;
      if (dayData?.cravings) xp += dayData.cravings * XP.CRAVING;
      if (dayData?.smoked) xp -= dayData.smoked * Math.abs(XP.SMOKED);
      const label = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      days.push({ date: ds, xp, label });
    }
    return days;
  }, [checkins, history]);

  const maxBarXP = Math.max(...barChart.map(d => Math.abs(d.xp)), 1);

  // Badge colors
  const badgeGradient = tier
    ? `linear-gradient(135deg, ${tier.color}, ${tier.colorTo})`
    : 'linear-gradient(135deg, #FFD700, #FF4500, #FFD700)';
  const badgeTextColor = tier?.textColor || '#FFD700';

  // ─── Rank tiers for display (scrollable) ──────────────
  const tierPreview = TIERS.map((t, i) => {
    const firstRankOfTier = RANK_TABLE.find(r => r.tierIdx === i);
    const unlocked = firstRankOfTier ? seasonXP >= firstRankOfTier.xpStart : false;
    const isCurrent = rank.tierIdx === i;
    return { ...t, unlocked, isCurrent, idx: i };
  });

  return (
    <div className="pt-20 pb-24 min-h-screen">
      <div className="max-w-md mx-auto px-4 space-y-4">

        {/* ═══════════ HERO RANK CARD ═══════════ */}
        <div className="glass-card rounded-3xl p-6 text-center relative overflow-hidden">
          <div className="shimmer absolute inset-0 pointer-events-none" />
          <div className="relative">
            {/* Rank Badge */}
            <div
              className="w-20 h-20 mx-auto mb-3 rounded-full flex items-center justify-center text-4xl shadow-lg"
              style={{
                background: badgeGradient,
                boxShadow: `0 0 30px ${tier?.color || '#FFD700'}33`,
              }}
            >
              {isConqueror ? '🏆' : tier?.badge}
            </div>

            {/* Rank Name */}
            <h2
              className="text-2xl font-bold font-display mb-0.5"
              style={{ color: badgeTextColor }}
            >
              {rank.division ? `${rank.name} ${rank.division}` : rank.name}
            </h2>

            {/* Season Badge */}
            <div className="inline-flex items-center gap-1.5 mb-1">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-xs font-bold text-orange-400">Season {currentSeason}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-1">
              Day {dayInSeason + 1} / {SEASON_DAYS} • {daysLeftInSeason} days left
            </p>
            {/* Season progress bar */}
            <div className="w-32 mx-auto h-1 bg-muted/15 rounded-full overflow-hidden mb-3">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all"
                style={{ width: `${seasonPct}%` }}
              />
            </div>

            {/* XP Display */}
            <div className="inline-flex items-center gap-1.5 mb-3">
              <span className="text-3xl font-bold font-display" style={{ color: badgeTextColor }}>
                {seasonXP.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">XP</span>
            </div>

            {/* Progress Bar */}
            {!isConqueror && (
              <div className="mb-2">
                <div className="w-full h-2.5 bg-muted/15 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${rankPct}%`,
                      background: badgeGradient,
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
                  <span>{xpInRank.toLocaleString()} / {xpNeeded.toLocaleString()} XP</span>
                  <span>Next: {nextRank?.division ? `${nextRank.name} ${nextRank.division}` : nextRank?.name}</span>
                </div>
              </div>
            )}

            {/* Today's net */}
            <div className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
              todayNetXP >= 0
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-500 border border-red-500/20'
            }`}>
              {todayNetXP >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {todayNetXP >= 0 ? '+' : ''}{todayNetXP} XP today
            </div>
          </div>
        </div>

        {/* ═══════════ QUICK ACTIONS ═══════════ */}
        <div className="grid grid-cols-2 gap-3">
          {/* Victories Card */}
          <div className="glass-card rounded-3xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Swords className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground font-display">Victories</h3>
                <p className="text-[10px] text-muted-foreground">Cravings defeated</p>
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <button onClick={() => dec('cravings')} className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center active:scale-90 transition-transform">
                <Minus className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <span className="text-3xl font-bold text-emerald-500 font-display">{totals.cravings}</span>
              <button onClick={() => inc('cravings')} className="w-8 h-8 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/25 flex items-center justify-center active:scale-90 transition-transform">
                <Plus className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
            <div className="text-center text-[11px] font-medium text-emerald-500">
              +{todayScore.cravings * XP.CRAVING} XP today
            </div>
          </div>

          {/* Setbacks Card */}
          <div className="glass-card rounded-3xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
                <Cigarette className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground font-display">Setbacks</h3>
                <p className="text-[10px] text-muted-foreground">Cigarettes smoked</p>
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <button onClick={() => dec('smoked')} className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center active:scale-90 transition-transform">
                <Minus className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <span className="text-3xl font-bold text-red-500 font-display">{totals.smoked}</span>
              <button onClick={() => inc('smoked')} className="w-8 h-8 rounded-full bg-red-500 shadow-lg shadow-red-500/25 flex items-center justify-center active:scale-90 transition-transform">
                <Plus className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
            <div className="text-center text-[11px] font-medium text-red-500">
              -{todayScore.smoked * Math.abs(XP.SMOKED)} XP today
            </div>
          </div>
        </div>

        {/* ═══════════ GYM COUNTER ═══════════ */}
        <div className="glass-card rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Dumbbell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground font-display">Gym</h3>
                <p className="text-[11px] text-muted-foreground">+{XP.GYM} XP per session</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={() => dec('gym')} className="w-9 h-9 rounded-full bg-muted/40 flex items-center justify-center active:scale-90 transition-transform">
                <Minus className="w-4 h-4 text-muted-foreground" />
              </button>
              <span className="text-2xl font-bold text-blue-500 font-display min-w-[2.5ch] text-center">{totals.gym}</span>
              <button onClick={() => inc('gym')} className="w-9 h-9 rounded-full bg-blue-500 shadow-lg shadow-blue-500/25 flex items-center justify-center active:scale-90 transition-transform">
                <Plus className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/10 flex justify-between text-[11px] text-muted-foreground">
            <span className="text-blue-400">+{todayScore.gym * XP.GYM} XP today</span>
            <span>{todayScore.gym} today</span>
          </div>
        </div>

        {/* ═══════════ XP SUMMARY ═══════════ */}
        <div className="glass-card rounded-3xl p-5">
          <h3 className="text-sm font-bold text-foreground font-display uppercase tracking-wide mb-3">Today's XP Breakdown</h3>
          <div className="space-y-2">
            {todayCheckedIn && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Daily Check-in</span>
                <span className="text-emerald-500 font-bold">+{XP.CHECKIN}</span>
              </div>
            )}
            {todayScore.gym > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Gym × {todayScore.gym}</span>
                <span className="text-blue-500 font-bold">+{todayScore.gym * XP.GYM}</span>
              </div>
            )}
            {todayScore.cravings > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cravings Defeated × {todayScore.cravings}</span>
                <span className="text-emerald-500 font-bold">+{todayScore.cravings * XP.CRAVING}</span>
              </div>
            )}
            {todayScore.smoked > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cigarettes Smoked × {todayScore.smoked}</span>
                <span className="text-red-500 font-bold">-{todayScore.smoked * Math.abs(XP.SMOKED)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-white/10 flex justify-between text-sm font-bold">
              <span className="text-foreground">Net XP Today</span>
              <span className={todayNetXP >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                {todayNetXP >= 0 ? '+' : ''}{todayNetXP}
              </span>
            </div>
          </div>
        </div>

        {/* ═══════════ TODAY'S MISSIONS ═══════════ */}
        <div className="glass-card rounded-3xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground font-display uppercase tracking-wide">Today's Missions</h3>
            <span className="text-xs font-bold text-primary bg-primary/10 rounded-full px-2.5 py-0.5">{missionsDone}/{missions.length}</span>
          </div>
          <div className="space-y-3">
            {missions.map((m, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${m.done ? 'bg-primary' : 'border-2 border-muted-foreground/25'}`}>
                    {m.done && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className={`text-sm ${m.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{m.label}</span>
                </div>
                <span className={`text-xs font-medium ${m.done ? 'text-primary' : 'text-muted-foreground'}`}>+{m.xp} XP</span>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════ RECOVERY STATS ═══════════ */}
        <div className="glass-card rounded-3xl p-5">
          <h3 className="text-sm font-bold text-foreground font-display uppercase tracking-wide mb-4">Recovery Stats</h3>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-3.5 text-center">
              <div className="text-xl font-bold text-primary font-display">₹{moneySaved.toLocaleString()}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Money Saved</div>
            </div>
            <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl p-3.5 text-center">
              <div className="text-xl font-bold text-orange-500 font-display">{cigsAvoided.toLocaleString()}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Cigarettes Avoided</div>
            </div>
            <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-3.5 text-center">
              <div className="text-xl font-bold text-blue-500 font-display">{hoursReclaimed}h</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Hours Reclaimed</div>
            </div>
            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-3.5 text-center">
              <div className="text-xl font-bold text-primary font-display">{seasonXP.toLocaleString()}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Season XP</div>
            </div>
          </div>
        </div>

        {/* ═══════════ XP BAR CHART ═══════════ */}
        <div className="glass-card rounded-3xl p-5">
          <h3 className="text-sm font-bold text-foreground font-display uppercase tracking-wide mb-4">Last 14 Days</h3>
          <div className="flex items-end gap-[5px] h-40">
            {barChart.map((d, i) => {
              const isToday = d.date === today;
              const barH = maxBarXP > 0 ? (Math.abs(d.xp) / maxBarXP) * 100 : 0;
              const isNeg = d.xp < 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  {/* XP label */}
                  <span className={`text-[8px] font-bold ${isNeg ? 'text-red-500' : d.xp > 0 ? 'text-primary' : 'text-muted-foreground/40'}`}>
                    {d.xp !== 0 ? (isNeg ? '' : '+') + d.xp : ''}
                  </span>
                  {/* Bar */}
                  <div
                    className={`w-full rounded-t-md transition-all duration-500 ${
                      isNeg
                        ? 'bg-gradient-to-t from-red-500 to-red-400'
                        : d.xp > 0
                          ? isToday
                            ? 'bg-gradient-to-t from-primary to-primary-light shadow-sm shadow-primary/20'
                            : 'bg-gradient-to-t from-primary/70 to-primary/50'
                          : 'bg-muted/10'
                    }`}
                    style={{ height: `${Math.max(barH, 3)}%`, minHeight: 3 }}
                  />
                  {/* Date label */}
                  <span className={`text-[7px] ${isToday ? 'text-primary font-bold' : 'text-muted-foreground/60'}`}>
                    {d.label.split(' ')[1]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══════════ RANK PROGRESSION PATH ═══════════ */}
        <div className="glass-card rounded-3xl p-5">
          <h3 className="text-sm font-bold text-foreground font-display uppercase tracking-wide mb-4">Rank Path</h3>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            {tierPreview.map((t, i) => (
              <div
                key={i}
                className={`flex-shrink-0 flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all ${
                  t.isCurrent
                    ? 'border-white/30 bg-white/5 scale-105'
                    : t.unlocked
                      ? 'border-white/10 bg-white/[0.02]'
                      : 'border-transparent opacity-30'
                }`}
                style={{ minWidth: 70 }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-md"
                  style={{ background: `linear-gradient(135deg, ${t.color}, ${t.colorTo})` }}
                >
                  {t.badge}
                </div>
                <span className={`text-[10px] font-bold ${t.isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {t.name}
                </span>
              </div>
            ))}
            {/* Conqueror */}
            <div
              className={`flex-shrink-0 flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all ${
                isConqueror ? 'border-yellow-500/30 bg-yellow-500/5 scale-105' : 'border-transparent opacity-30'
              }`}
              style={{ minWidth: 70 }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-md bg-gradient-to-br from-yellow-500 via-red-500 to-yellow-500">
                🏆
              </div>
              <span className="text-[10px] font-bold text-muted-foreground">Conqueror</span>
            </div>
          </div>
        </div>

      </div>

      {/* ═══════════ LEVEL UP MODAL ═══════════ */}
      {showLevelUp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLevelUp(false)} />
          <div className="relative glass-card rounded-3xl p-8 text-center max-w-sm w-full animate-bounce-in">
            {/* Confetti */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full animate-confetti"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: '50%',
                    backgroundColor: ['#FFD700', '#10B981', '#4FC3F7', '#EF4444', '#9C27B0', '#00E5FF'][i % 6],
                    animationDelay: `${Math.random() * 0.8}s`,
                    animationDuration: `${1 + Math.random()}s`,
                  }}
                />
              ))}
            </div>

            <div className="relative">
              <div className="text-6xl mb-4">🎖️</div>
              <h2 className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">Rank Up!</h2>
              <h3
                className="text-2xl font-bold font-display mb-2"
                style={{ color: badgeTextColor }}
              >
                {levelUpRank}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                You've proven your discipline. Keep pushing forward.
              </p>
              <button
                onClick={() => setShowLevelUp(false)}
                className="w-full py-3 rounded-2xl font-bold text-white text-sm transition-all active:scale-95"
                style={{ background: badgeGradient }}
              >
                Continue Fighting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Score;