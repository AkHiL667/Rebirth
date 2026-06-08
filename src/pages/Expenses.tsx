import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, IndianRupee, TrendingUp, Wallet, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ─── Storage ────────────────────────────────────────────────
const STORAGE_KEY = 'rebirth_expenses';

interface ExpenseEntry {
  id: string;
  key: string;
  amount: number;
}

interface MonthData {
  month: string; // "2026-06"
  entries: ExpenseEntry[];
  notes: string;
}

type ExpenseStore = MonthData[];

// ─── Helpers ────────────────────────────────────────────────
const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const formatMonth = (m: string) => {
  const [year, month] = m.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const generateId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// ─── Component ──────────────────────────────────────────────
const Expenses = () => {
  const [store, setStore] = useState<ExpenseStore>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return [];
  });
  const [expandedMonth, setExpandedMonth] = useState<string>(getCurrentMonth());
  const [newKey, setNewKey] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const [showLifetime, setShowLifetime] = useState(false);

  // Save helper
  const save = (updated: ExpenseStore) => {
    setStore(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // Ensure current month exists
  const currentMonth = getCurrentMonth();
  const ensureMonth = (data: ExpenseStore, month: string): ExpenseStore => {
    if (data.find(m => m.month === month)) return data;
    return [...data, { month, entries: [], notes: '' }].sort((a, b) => b.month.localeCompare(a.month));
  };

  // Initialize current month on mount
  useEffect(() => {
    if (!store.find(m => m.month === currentMonth)) {
      save(ensureMonth(store, currentMonth));
    }
  }, [currentMonth]);

  // Sorted months (newest first)
  const sortedMonths = useMemo(() =>
    [...store].sort((a, b) => b.month.localeCompare(a.month))
  , [store]);

  // Add entry
  const addEntry = (month: string) => {
    const trimmedKey = newKey.trim();
    const amount = parseFloat(newAmount);
    if (!trimmedKey || isNaN(amount) || amount <= 0) return;

    const updated = ensureMonth(store, month).map(m =>
      m.month === month
        ? { ...m, entries: [...m.entries, { id: generateId(), key: trimmedKey, amount }] }
        : m
    );
    save(updated);
    setNewKey('');
    setNewAmount('');
  };

  // Remove entry
  const removeEntry = (month: string, entryId: string) => {
    const updated = store.map(m =>
      m.month === month
        ? { ...m, entries: m.entries.filter(e => e.id !== entryId) }
        : m
    );
    save(updated);
  };

  // Save notes
  const saveNotes = (month: string) => {
    const updated = store.map(m =>
      m.month === month ? { ...m, notes: tempNotes } : m
    );
    save(updated);
    setEditingNotes(null);
  };

  // Month total
  const getMonthTotal = (entries: ExpenseEntry[]) =>
    entries.reduce((sum, e) => sum + e.amount, 0);

  // Lifetime aggregation
  const lifetimeStats = useMemo(() => {
    const map = new Map<string, number>();
    let total = 0;
    for (const m of store) {
      for (const e of m.entries) {
        map.set(e.key, (map.get(e.key) || 0) + e.amount);
        total += e.amount;
      }
    }
    const sorted = [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([key, amount]) => ({ key, amount, pct: total > 0 ? Math.round((amount / total) * 100) : 0 }));
    return { categories: sorted, total };
  }, [store]);

  // Current month data
  const currentMonthData = sortedMonths.find(m => m.month === currentMonth);
  const currentTotal = currentMonthData ? getMonthTotal(currentMonthData.entries) : 0;
  const topCategory = lifetimeStats.categories[0];

  return (
    <div className="pt-20 pb-24 min-h-screen">
      <div className="max-w-md mx-auto px-4 space-y-4">

        {/* ═══════════ SUMMARY CARD ═══════════ */}
        <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
          <div className="shimmer absolute inset-0 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground font-display">Expenses</h2>
                <p className="text-[11px] text-muted-foreground">{formatMonth(currentMonth)}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-xl font-bold text-amber-500 font-display">₹{currentTotal.toLocaleString()}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">This Month</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-foreground font-display">{currentMonthData?.entries.length || 0}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Items</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-primary font-display">₹{lifetimeStats.total.toLocaleString()}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">All-Time</div>
              </div>
            </div>

            {topCategory && (
              <div className="mt-3 pt-3 border-t border-white/10 text-center">
                <span className="text-[11px] text-muted-foreground">Top Spend: </span>
                <span className="text-[11px] font-bold text-amber-500">{topCategory.key} ₹{topCategory.amount.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════ MONTHLY CARDS ═══════════ */}
        {sortedMonths.map(monthData => {
          const isExpanded = expandedMonth === monthData.month;
          const monthTotal = getMonthTotal(monthData.entries);
          const isCurrent = monthData.month === currentMonth;

          return (
            <div key={monthData.month} className="glass-card rounded-3xl overflow-hidden">
              {/* Month Header */}
              <button
                onClick={() => setExpandedMonth(isExpanded ? '' : monthData.month)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm ${
                    isCurrent
                      ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white'
                      : 'bg-muted/20 text-muted-foreground'
                  }`}>
                    📅
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground font-display">{formatMonth(monthData.month)}</h3>
                    <p className="text-[11px] text-muted-foreground">{monthData.entries.length} entries</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-amber-500 font-display">₹{monthTotal.toLocaleString()}</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-5 pb-5 border-t border-white/10">
                  {/* Entries */}
                  {monthData.entries.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {monthData.entries.map(entry => (
                        <div key={entry.id} className="flex items-center justify-between py-2 px-3 bg-muted/5 rounded-xl">
                          <span className="text-sm text-foreground">{entry.key}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-amber-500 font-display">₹{entry.amount.toLocaleString()}</span>
                            <button
                              onClick={() => removeEntry(monthData.month, entry.id)}
                              className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Entry Form */}
                  <div className="mt-4 flex gap-2">
                    <Input
                      placeholder="Name"
                      value={newKey}
                      onChange={e => setNewKey(e.target.value)}
                      className="flex-1 h-9 text-sm rounded-xl bg-muted/10 border-white/10"
                      onKeyDown={e => e.key === 'Enter' && addEntry(monthData.month)}
                    />
                    <div className="relative w-28">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                      <Input
                        placeholder="Amount"
                        type="number"
                        value={newAmount}
                        onChange={e => setNewAmount(e.target.value)}
                        className="h-9 text-sm rounded-xl bg-muted/10 border-white/10 pl-6"
                        onKeyDown={e => e.key === 'Enter' && addEntry(monthData.month)}
                      />
                    </div>
                    <button
                      onClick={() => addEntry(monthData.month)}
                      className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center active:scale-90 transition-transform shadow-lg shadow-amber-500/20"
                    >
                      <Plus className="w-4 h-4 text-white" />
                    </button>
                  </div>

                  {/* Month Total */}
                  {monthData.entries.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10 flex justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Month Total</span>
                      <span className="text-sm font-bold text-foreground font-display">₹{monthTotal.toLocaleString()}</span>
                    </div>
                  )}

                  {/* Notes */}
                  <div className="mt-3 pt-3 border-t border-white/10">
                    {editingNotes === monthData.month ? (
                      <div className="space-y-2">
                        <textarea
                          value={tempNotes}
                          onChange={e => setTempNotes(e.target.value)}
                          placeholder="What happened this month..."
                          className="w-full bg-muted/10 border border-white/10 rounded-xl p-3 text-sm text-foreground resize-none h-20 focus:outline-none focus:border-amber-500/50"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setEditingNotes(null)}
                            className="text-xs text-muted-foreground px-3 py-1.5 rounded-lg hover:bg-muted/20"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => saveNotes(monthData.month)}
                            className="text-xs font-bold text-white bg-amber-500 px-3 py-1.5 rounded-lg active:scale-95"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingNotes(monthData.month); setTempNotes(monthData.notes || ''); }}
                        className="flex items-center gap-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors w-full text-left"
                      >
                        <StickyNote className="w-3.5 h-3.5" />
                        {monthData.notes ? (
                          <span className="text-foreground/70 italic line-clamp-2">{monthData.notes}</span>
                        ) : (
                          <span>Add notes for this month...</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* ═══════════ LIFETIME ANALYTICS ═══════════ */}
        {lifetimeStats.categories.length > 0 && (
          <div className="glass-card rounded-3xl overflow-hidden">
            <button
              onClick={() => setShowLifetime(!showLifetime)}
              className="w-full flex items-center justify-between p-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground font-display">Lifetime Analytics</h3>
                  <p className="text-[11px] text-muted-foreground">{lifetimeStats.categories.length} categories across {store.length} months</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-primary font-display">₹{lifetimeStats.total.toLocaleString()}</span>
                {showLifetime ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
            </button>

            {showLifetime && (
              <div className="px-5 pb-5 border-t border-white/10">
                <div className="mt-4 space-y-3">
                  {lifetimeStats.categories.map((cat, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-foreground">{cat.key}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground font-display">₹{cat.amount.toLocaleString()}</span>
                          <span className="text-[10px] text-muted-foreground bg-muted/15 rounded-full px-2 py-0.5">{cat.pct}%</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-muted/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                          style={{ width: `${cat.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Expenses;
