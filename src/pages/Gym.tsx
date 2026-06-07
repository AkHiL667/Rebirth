import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Search, X, Calendar, TrendingUp, ChevronUp, ChevronDown, StickyNote, Weight, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ─── Storage ────────────────────────────────────────────────
const STORAGE_KEY = 'rebirth_gym_log';

interface GymEntry {
  date: string;      // "2026-06-07"
  weight?: number;    // kg
  notes?: string;
}

type GymLog = GymEntry[];

// ─── Helpers ────────────────────────────────────────────────
const getToday = () => new Date().toISOString().split('T')[0];

const formatDate = (d: string) => {
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
};

const formatDateShort = (d: string) => {
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
};

// ─── Component ──────────────────────────────────────────────
const Gym = () => {
  const [log, setLog] = useState<GymLog>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [chartRange, setChartRange] = useState<'week' | 'month'>('week');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Load
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setLog(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  // Save
  const persist = useCallback((newLog: GymLog) => {
    setLog(newLog);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newLog));
  }, []);

  // ─── Add entry ───────────────────────────────────────
  const handleAdd = () => {
    const today = getToday();
    const w = weight ? parseFloat(weight) : undefined;
    const n = notes.trim() || undefined;

    if (!w && !n) {
      setShowAdd(false);
      return;
    }

    const existing = log.findIndex(e => e.date === today);
    let newLog: GymLog;
    if (existing >= 0) {
      // Update today's entry
      newLog = [...log];
      newLog[existing] = {
        ...newLog[existing],
        weight: w ?? newLog[existing].weight,
        notes: n ?? newLog[existing].notes,
      };
    } else {
      newLog = [{ date: today, weight: w, notes: n }, ...log];
    }

    persist(newLog);
    setWeight('');
    setNotes('');
    setShowAdd(false);
  };

  // ─── Edit entry ──────────────────────────────────────
  const startEdit = (entry: GymEntry) => {
    setEditingId(entry.date);
    setEditWeight(entry.weight?.toString() || '');
    setEditNotes(entry.notes || '');
  };

  const saveEdit = (date: string) => {
    const w = editWeight ? parseFloat(editWeight) : undefined;
    const n = editNotes.trim() || undefined;
    const newLog = log.map(e =>
      e.date === date ? { ...e, weight: w, notes: n } : e
    );
    persist(newLog);
    setEditingId(null);
  };

  const deleteEntry = (date: string) => {
    persist(log.filter(e => e.date !== date));
  };

  // ─── Sorted log (newest first) ───────────────────────
  const sortedLog = useMemo(() =>
    [...log].sort((a, b) => b.date.localeCompare(a.date)),
    [log]
  );

  // ─── Filter by search ────────────────────────────────
  const filteredLog = useMemo(() => {
    if (!searchQuery.trim()) return sortedLog;
    const q = searchQuery.toLowerCase();
    return sortedLog.filter(e =>
      (e.notes && e.notes.toLowerCase().includes(q)) ||
      e.date.includes(q) ||
      formatDate(e.date).toLowerCase().includes(q)
    );
  }, [sortedLog, searchQuery]);

  // ─── Weight chart data ───────────────────────────────
  const chartData = useMemo(() => {
    const now = new Date();
    const daysBack = chartRange === 'week' ? 7 : 30;
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - daysBack);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    return sortedLog
      .filter(e => e.weight && e.date >= cutoffStr)
      .sort((a, b) => a.date.localeCompare(b.date)); // oldest first for chart
  }, [sortedLog, chartRange]);

  const hasWeightData = chartData.length > 0;
  const minWeight = hasWeightData ? Math.min(...chartData.map(e => e.weight!)) : 0;
  const maxWeight = hasWeightData ? Math.max(...chartData.map(e => e.weight!)) : 0;
  const weightRange = maxWeight - minWeight || 1;
  const latestWeight = hasWeightData ? chartData[chartData.length - 1].weight! : null;
  const earliestWeight = hasWeightData ? chartData[0].weight! : null;
  const weightChange = latestWeight && earliestWeight ? latestWeight - earliestWeight : null;

  const today = getToday();
  const hasTodayEntry = log.some(e => e.date === today);

  return (
    <div className="pt-20 pb-24 min-h-screen">
      <div className="max-w-md mx-auto px-4 space-y-4">

        {/* ═══════════ WEIGHT TRACKER CARD ═══════════ */}
        <div className="glass-card rounded-3xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground font-display uppercase tracking-wide">Weight Tracker</h3>
            </div>
            <div className="flex bg-muted/20 rounded-lg p-0.5">
              <button
                onClick={() => setChartRange('week')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  chartRange === 'week'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setChartRange('month')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  chartRange === 'month'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Month
              </button>
            </div>
          </div>

          {hasWeightData ? (
            <>
              {/* Stats Row */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-2xl font-bold text-foreground font-display">{latestWeight}</span>
                  <span className="text-sm text-muted-foreground ml-1">kg</span>
                </div>
                {weightChange !== null && chartData.length > 1 && (
                  <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                    weightChange > 0
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : weightChange < 0
                        ? 'bg-red-500/10 text-red-500'
                        : 'bg-muted/30 text-muted-foreground'
                  }`}>
                    {weightChange > 0 ? <ChevronUp className="w-3 h-3" /> : weightChange < 0 ? <ChevronDown className="w-3 h-3" /> : null}
                    {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
                  </div>
                )}
              </div>

              {/* Bar Chart */}
              <div className="flex items-end gap-[4px] h-28">
                {chartData.map((d, i) => {
                  const pct = weightRange > 0
                    ? ((d.weight! - minWeight) / weightRange) * 80 + 20
                    : 50;
                  const isLatest = i === chartData.length - 1;
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <span className={`text-[8px] font-bold ${isLatest ? 'text-primary' : 'text-muted-foreground/60'}`}>
                        {d.weight}
                      </span>
                      <div
                        className={`w-full rounded-t-md transition-all duration-500 ${
                          isLatest
                            ? 'bg-gradient-to-t from-primary to-primary/70 shadow-sm shadow-primary/20'
                            : 'bg-gradient-to-t from-primary/50 to-primary/30'
                        }`}
                        style={{ height: `${pct}%`, minHeight: 4 }}
                      />
                      <span className={`text-[7px] ${isLatest ? 'text-primary font-bold' : 'text-muted-foreground/60'}`}>
                        {formatDateShort(d.date).split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Weight className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No weight data yet</p>
              <p className="text-xs mt-1">Log your weight below to see trends</p>
            </div>
          )}
        </div>

        {/* ═══════════ SEARCH & FILTER ═══════════ */}
        <div className="glass-card rounded-3xl p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes, dates..."
              className="pl-9 pr-9 bg-muted/20 border-0 rounded-xl h-10 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* ═══════════ GYM LOG ENTRIES ═══════════ */}
        {filteredLog.length > 0 ? (
          <div className="space-y-3">
            {filteredLog.map((entry) => (
              <div key={entry.date} className="glass-card rounded-2xl p-4">
                {editingId === entry.date ? (
                  /* Edit Mode */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">{formatDate(entry.date)}</span>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-xs text-muted-foreground mb-1 block">Weight (kg)</label>
                        <Input
                          type="number"
                          step="0.1"
                          value={editWeight}
                          onChange={(e) => setEditWeight(e.target.value)}
                          placeholder="Weight"
                          className="h-9 text-sm bg-muted/20 border-0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
                      <Input
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Workout notes..."
                        className="h-9 text-sm bg-muted/20 border-0"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => saveEdit(entry.date)} size="sm" className="flex-1 h-8 text-xs bg-primary hover:bg-primary/90">
                        Save
                      </Button>
                      <Button onClick={() => setEditingId(null)} variant="outline" size="sm" className="h-8 text-xs">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div onClick={() => startEdit(entry)} className="cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">{formatDate(entry.date)}</span>
                        {entry.date === today && (
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">TODAY</span>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteEntry(entry.date); }}
                        className="p-1 text-muted-foreground/40 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      {entry.weight && (
                        <div className="flex items-center gap-1.5">
                          <Weight className="w-4 h-4 text-blue-500" />
                          <span className="text-lg font-bold text-foreground font-display">{entry.weight}</span>
                          <span className="text-xs text-muted-foreground">kg</span>
                        </div>
                      )}
                    </div>

                    {entry.notes && (
                      <div className="mt-2 flex items-start gap-1.5">
                        <StickyNote className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-muted-foreground leading-relaxed">{entry.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-3xl p-8 text-center">
            <Dumbbell className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'No matching entries' : 'No gym entries yet'}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {searchQuery ? 'Try a different search term' : 'Tap + to log your first session'}
            </p>
          </div>
        )}

        {/* Spacer for FAB */}
        <div className="h-16" />
      </div>

      {/* ═══════════ ADD MODAL ═══════════ */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div
            className="w-full max-w-md glass-card rounded-t-3xl p-6 pb-28 space-y-4 animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground font-display">Log Gym Session</h3>
              <button onClick={() => setShowAdd(false)} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              {formatDate(today)} {hasTodayEntry && '• Updates today\'s entry'}
            </p>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Weight (kg)</label>
              <Input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 72.5"
                className="bg-muted/20 border-0 h-11"
                autoFocus
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Notes</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Chest + Triceps, PR on bench..."
                className="bg-muted/20 border-0 h-11"
              />
            </div>

            <Button onClick={handleAdd} className="w-full h-12 text-sm font-bold bg-primary hover:bg-primary/90 rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              {hasTodayEntry ? 'Update Today\'s Entry' : 'Save Entry'}
            </Button>
          </div>
        </div>
      )}

      {/* ═══════════ FAB ═══════════ */}
      {!showAdd && (
        <button
          onClick={() => setShowAdd(true)}
          className="fixed bottom-24 right-6 z-40 w-14 h-14 rounded-full bg-primary shadow-lg shadow-primary/30 flex items-center justify-center active:scale-90 transition-transform"
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      )}
    </div>
  );
};

export default Gym;
