import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Swords, Plus, Minus, Check, Dumbbell, Shield, TrendingUp, TrendingDown, Cigarette, X } from 'lucide-react';
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

// ─── XP Config ──────────────────────────────────────────────
const XP = {
  SMOKE_FREE: 40,
  GYM: 20,
  CRAVING: 3,
  CHECKIN: 10,
  SMOKED: -10,
} as const;

// ─── Rank System ────────────────────────────────────────────
interface RankTier {
  name: string;
  color: string;       // gradient from
  colorTo: string;     // gradient to
  textColor: string;
  badge: string;
  minDays: number;     // smoke-free days required for this tier
}

const TIERS: RankTier[] = [
  { name: 'Bronze',         color: '#CD7F32', colorTo: '#A0522D', textColor: '#CD7F32', badge: '🥉', minDays: 0   },
  { name: 'Silver',         color: '#C0C0C0', colorTo: '#808080', textColor: '#A8A8A8', badge: '🥈', minDays: 10  },
  { name: 'Gold',           color: '#FFD700', colorTo: '#DAA520', textColor: '#DAA520', badge: '🥇', minDays: 30  },
  { name: 'Platinum',       color: '#4FC3F7', colorTo: '#0288D1', textColor: '#4FC3F7', badge: '💎', minDays: 60  },
  { name: 'Diamond',        color: '#00E5FF', colorTo: '#00B8D4', textColor: '#00E5FF', badge: '💠', minDays: 100 },
  { name: 'Crown',          color: '#9C27B0', colorTo: '#6A1B9A', textColor: '#CE93D8', badge: '👑', minDays: 180 },
  { name: 'Ace',            color: '#10B981', colorTo: '#059669', textColor: '#34D399', badge: '🃏', minDays: 365 },
  { name: 'Ace Dominator',  color: '#EF4444', colorTo: '#B91C1C', textColor: '#F87171', badge: '🔥', minDays: 450 },
  { name: 'Ace Master',     color: '#1C1917', colorTo: '#DAA520', textColor: '#FDE68A', badge: '⚔️', minDays: 540 },
];

const DIVISIONS = ['V', 'IV', 'III', 'II', 'I'] as const;

// Hand-crafted XP thresholds per division start
// Bronze V=0, I=2000 | Silver V=2500, I=5500 | Gold V=7000, I=12000
// Platinum V=14000, I=21000 | Diamond V=23000, I=31000 | Crown V=34000, I=40000
// Ace V=42000, I=46000 | AceDom V=46500, I=48500 | AceMaster V=49000, I=49800
// Conqueror = 50000
const RANK_XP_STARTS = [
  // Bronze V–I
  0, 500, 1000, 1500, 2000,
  // Silver V–I
  2500, 3100, 3700, 4500, 5500,
  // Gold V–I
  7000, 8000, 9200, 10500, 12000,
  // Platinum V–I
  14000, 15500, 17000, 19000, 21000,
  // Diamond V–I
  23000, 25000, 27000, 29000, 31000,
  // Crown V–I
  34000, 35500, 37000, 38500, 40000,
  // Ace V–I
  42000, 43000, 44000, 45000, 46000,
  // Ace Dominator V–I
  46500, 47000, 47500, 48000, 48500,
  // Ace Master V–I
  49000, 49200, 49400, 49600, 49800,
  // Conqueror
  50000,
];

// Build rank table from explicit thresholds
function buildRankTable() {
  const ranks: { name: string; division: string; xpStart: number; xpEnd: number; tierIdx: number; minDays: number }[] = [];
  for (let t = 0; t < TIERS.length; t++) {
    for (let d = 0; d < 5; d++) {
      const flatIdx = t * 5 + d;
      const xpStart = RANK_XP_STARTS[flatIdx];
      const xpEnd = RANK_XP_STARTS[flatIdx + 1];
      ranks.push({
        name: TIERS[t].name,
        division: DIVISIONS[d],
        xpStart,
        xpEnd,
        tierIdx: t,
        minDays: TIERS[t].minDays,
      });
    }
  }
  // Conqueror
  ranks.push({ name: 'Conqueror', division: '', xpStart: 50000, xpEnd: Infinity, tierIdx: -1, minDays: 730 });
  return ranks;
}
const RANK_TABLE = buildRankTable();

function getRankInfo(xp: number, days: number) {
  const clamped = Math.max(0, xp);
  // Find highest rank where user meets BOTH xp AND day requirements
  const rank = [...RANK_TABLE].reverse().find(r => clamped >= r.xpStart && days >= r.minDays) || RANK_TABLE[0];
  const idx = RANK_TABLE.indexOf(rank);
  const nextRank = idx < RANK_TABLE.length - 1 ? RANK_TABLE[idx + 1] : null;
  const xpInRank = clamped - rank.xpStart;
  const xpNeeded = rank.xpEnd === Infinity ? 1 : rank.xpEnd - rank.xpStart;
  const pct = rank.xpEnd === Infinity ? 100 : Math.min((xpInRank / xpNeeded) * 100, 100);
  // Check what's blocking next rank
  let blockedBy: 'none' | 'xp' | 'days' | 'both' = 'none';
  if (nextRank) {
    const needsXP = clamped < nextRank.xpStart;
    const needsDays = days < nextRank.minDays;
    if (needsXP && needsDays) blockedBy = 'both';
    else if (needsXP) blockedBy = 'xp';
    else if (needsDays) blockedBy = 'days';
  }
  return { rank, idx, nextRank, xpInRank, xpNeeded, pct, blockedBy };
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

  // ─── Totals ───────────────────────────────────────────
  const totals = useMemo(() =>
    Object.values(history).reduce(
      (a, d) => ({ gym: a.gym + d.gym, cravings: a.cravings + (d.cravings || 0), smoked: a.smoked + (d.smoked || 0) }),
      { gym: 0, cravings: 0, smoked: 0 }
    ), [history]);

  // ─── XP Calculations ─────────────────────────────────
  const totalXP = useMemo(() => {
    const smokeFreeXP = daysOnJourney * XP.SMOKE_FREE;
    const gymXP = totals.gym * XP.GYM;
    const cravingXP = totals.cravings * XP.CRAVING;
    const checkinXP = checkins.filter(c => c.checkedIn).length * XP.CHECKIN;
    const smokedPenalty = totals.smoked * Math.abs(XP.SMOKED);
    return Math.max(0, smokeFreeXP + gymXP + cravingXP + checkinXP - smokedPenalty);
  }, [daysOnJourney, totals, checkins]);

  const todayPositiveXP = useMemo(() => {
    let xp = todayScore.gym * XP.GYM + todayScore.cravings * XP.CRAVING;
    if (todayCheckedIn) xp += XP.CHECKIN + XP.SMOKE_FREE;
    return xp;
  }, [todayCheckedIn, todayScore]);

  const todayNegativeXP = useMemo(() =>
    todayScore.smoked * Math.abs(XP.SMOKED)
  , [todayScore.smoked]);

  const todayNetXP = todayPositiveXP - todayNegativeXP;

  // ─── Rank ─────────────────────────────────────────────
  const { rank, idx: rankIdx, nextRank, xpInRank, xpNeeded, pct: rankPct, blockedBy } = useMemo(
    () => getRankInfo(totalXP, daysOnJourney), [totalXP, daysOnJourney]
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
    { label: 'Stay Smoke-Free', done: todayCheckedIn, xp: XP.SMOKE_FREE },
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
      if (hasCheckin) xp += XP.SMOKE_FREE + XP.CHECKIN;
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
    const unlocked = firstRankOfTier ? totalXP >= firstRankOfTier.xpStart && daysOnJourney >= t.minDays : false;
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

            {/* Day */}
            <p className="text-xs text-muted-foreground mb-1">
              Day {daysOnJourney} • {daysOnJourney} Smoke-Free Days
            </p>
            {rank.minDays > 0 && (
              <p className="text-[10px] text-muted-foreground/60 mb-3">
                Requires {rank.minDays}+ days
              </p>
            )}
            {!rank.minDays && <div className="mb-3" />}

            {/* XP Display */}
            <div className="inline-flex items-center gap-1.5 mb-3">
              <span className="text-3xl font-bold font-display" style={{ color: badgeTextColor }}>
                {totalXP.toLocaleString()}
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
                {/* Blocker indicator */}
                {blockedBy === 'days' && nextRank && (
                  <p className="text-[10px] text-amber-500 mt-1.5 text-center">
                    🔒 Need {nextRank.minDays - daysOnJourney} more smoke-free days to rank up
                  </p>
                )}
                {blockedBy === 'both' && nextRank && (
                  <p className="text-[10px] text-amber-500 mt-1.5 text-center">
                    🔒 Need more XP + {nextRank.minDays - daysOnJourney} more days
                  </p>
                )}
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
                <span className="text-muted-foreground">Smoke-Free + Check-in</span>
                <span className="text-emerald-500 font-bold">+{XP.SMOKE_FREE + XP.CHECKIN}</span>
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
              <div className="text-xl font-bold text-primary font-display">{totalXP.toLocaleString()}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Lifetime XP</div>
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
                <span className={`text-[9px] ${t.unlocked ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
                  {t.minDays}d
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
              <span className="text-[9px] text-muted-foreground/50">730d</span>
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