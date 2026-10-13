import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MarketType, 
  Timeframe, 
  Direction, 
  ConfirmedSetup, 
  MarketPulse, 
  BacktestResult 
} from './types/scanner';
import { 
  DEFAULT_WATCHLIST_SYMBOLS, 
  fetch24hTickers, 
  fetchKlines, 
  batchScanCandles 
} from './utils/binanceApi';
import { evaluateQuantitativeConfluence } from './utils/indicators';
import { runVectorizedSimulation } from './utils/backtestEngine';
import { playSignalAlertSound } from './utils/audioAlert';
import { Header } from './components/Header';
import { MarketPulseBanner } from './components/MarketPulseBanner';
import { SetupCard } from './components/SetupCard';
import { DiagnosticsTable } from './components/DiagnosticsTable';
import { BacktestModal } from './components/BacktestModal';
import { TelegramModal } from './components/TelegramModal';
import { ActivePositionPanel } from './components/ActivePositionPanel';
import { TradeHistoryTable } from './components/TradeHistoryTable';
import { ActivePosition, ClosedTrade, TradeOutcome } from './types/paperTrading';
import { 
  ShieldAlert, 
  Search, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Filter, 
  ShieldCheck, 
  AlertTriangle, 
  Zap, 
  Activity,
  CheckCircle2
} from 'lucide-react';

export default function App() {
  const [isArabic, setIsArabic] = useState<boolean>(true);
  const [marketType, setMarketType] = useState<MarketType>('FUTURES');
  const [timeframe, setTimeframe] = useState<Timeframe>('15m');
  const [confirmedOnly, setConfirmedOnly] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isAutoRefreshActive, setIsAutoRefreshActive] = useState<boolean>(true);
  const [refreshIntervalSeconds, setRefreshIntervalSeconds] = useState<number>(25);
  const [countdown, setCountdown] = useState<number>(25);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [lastScanTime, setLastScanTime] = useState<number>(Date.now());

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'LONG' | 'SHORT'>('ALL');
  const [customSymbolInput, setCustomSymbolInput] = useState<string>('');

  // Watchlist
  const [symbols, setSymbols] = useState<string[]>(DEFAULT_WATCHLIST_SYMBOLS);

  // Results
  const [confirmedSetups, setConfirmedSetups] = useState<ConfirmedSetup[]>([]);
  const [unconfirmedSetups, setUnconfirmedSetups] = useState<ConfirmedSetup[]>([]);
  const [marketPulse, setMarketPulse] = useState<MarketPulse>({
    totalScanned: 0,
    confirmedCount: 0,
    bullishDominance: 50,
    bearishDominance: 50,
    neutralCount: 0,
    avgVolumeSurge: 1.0,
    lastUpdated: Date.now()
  });

  // Alert Beacon State
  const [newAlertSymbol, setNewAlertSymbol] = useState<string | null>(null);
  const knownConfirmedSymbolsRef = useRef<Set<string>>(new Set());

  // Modal State
  const [isBacktestModalOpen, setIsBacktestModalOpen] = useState<boolean>(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState<boolean>(false);
  const [selectedSetupForBacktest, setSelectedSetupForBacktest] = useState<ConfirmedSetup | null>(null);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [isBacktesting, setIsBacktesting] = useState<boolean>(false);
  const [modalTab, setModalTab] = useState<'results' | 'python'>('results');

  // 20x Futures Paper Trading Simulation State
  const [activePosition, setActivePosition] = useState<ActivePosition | null>(() => {
    try {
      const saved = localStorage.getItem('strict_alpha_active_position');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [closedTrades, setClosedTrades] = useState<ClosedTrade[]>(() => {
    try {
      const saved = localStorage.getItem('strict_alpha_closed_trades');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [demoBalance, setDemoBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('strict_alpha_demo_balance');
      return saved ? parseFloat(saved) : 100.0;
    } catch {
      return 100.0;
    }
  });

  const [lastPollTimestamp, setLastPollTimestamp] = useState<number>(Date.now());

  useEffect(() => {
    try {
      if (activePosition) {
        localStorage.setItem('strict_alpha_active_position', JSON.stringify(activePosition));
      } else {
        localStorage.removeItem('strict_alpha_active_position');
      }
    } catch {}
  }, [activePosition]);

  useEffect(() => {
    try {
      localStorage.setItem('strict_alpha_closed_trades', JSON.stringify(closedTrades));
    } catch {}
  }, [closedTrades]);

  useEffect(() => {
    try {
      localStorage.setItem('strict_alpha_demo_balance', demoBalance.toString());
    } catch {}
  }, [demoBalance]);

  // 3-second Live Polling for 20x Futures Position
  useEffect(() => {
    if (!activePosition) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${activePosition.symbol}`);
        if (!res.ok) return;
        const data = await res.json();
        const livePrice = parseFloat(data.price);
        if (!livePrice || isNaN(livePrice)) return;

        const isLong = activePosition.direction === 'LONG';
        const rawDiff = isLong ? (livePrice - activePosition.entryPrice) : (activePosition.entryPrice - livePrice);
        const pnlPercent = (rawDiff / activePosition.entryPrice) * 100 * activePosition.leverage;
        const pnlDollar = activePosition.margin * (pnlPercent / 100);

        setLastPollTimestamp(Date.now());

        // Check Exit Triggers
        const isTpHit = isLong ? (livePrice >= activePosition.takeProfitPrice) : (livePrice <= activePosition.takeProfitPrice);
        const isSlHit = isLong ? (livePrice <= activePosition.stopLossPrice) : (livePrice >= activePosition.stopLossPrice);
        const isLiqHit = isLong ? (livePrice <= activePosition.liquidationPrice) : (livePrice >= activePosition.liquidationPrice);

        let outcome: TradeOutcome | null = null;
        let outcomeTextAr = '';

        if (isLiqHit || pnlPercent <= -100) {
          outcome = 'LIQUIDATED';
          outcomeTextAr = '⚠️ تمت تصفية الصفقة (Liquidation)';
          if (soundEnabled) playSignalAlertSound('SHORT');
        } else if (isTpHit) {
          outcome = 'TP_HIT';
          outcomeTextAr = '🟢 تم تحقيق الهدف (TP)';
          if (soundEnabled) playSignalAlertSound('LONG');
        } else if (isSlHit) {
          outcome = 'SL_HIT';
          outcomeTextAr = '🔴 تم ضرب وقف الخسارة (SL)';
          if (soundEnabled) playSignalAlertSound('SHORT');
        }

        if (outcome) {
          const finalPnlDollar = outcome === 'LIQUIDATED' ? -activePosition.margin : Number(pnlDollar.toFixed(2));
          const finalPnlPercent = outcome === 'LIQUIDATED' ? -100 : Number(pnlPercent.toFixed(2));

          const closed: ClosedTrade = {
            id: activePosition.id,
            symbol: activePosition.symbol,
            direction: activePosition.direction,
            entryPrice: activePosition.entryPrice,
            exitPrice: livePrice,
            margin: activePosition.margin,
            leverage: activePosition.leverage,
            notionalSize: activePosition.notionalSize,
            pnlDollar: finalPnlDollar,
            pnlPercent: finalPnlPercent,
            outcome,
            outcomeTextAr,
            openedAt: activePosition.openedAt,
            closedAt: Date.now()
          };

          setClosedTrades((prev) => [closed, ...prev]);
          setDemoBalance((prev) => Number((prev + activePosition.margin + finalPnlDollar).toFixed(2)));
          setActivePosition(null);
        } else {
          setActivePosition((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              currentPrice: livePrice,
              pnlPercent: Number(pnlPercent.toFixed(2)),
              pnlDollar: Number(pnlDollar.toFixed(2)),
              lastUpdatedAt: Date.now()
            };
          });
        }
      } catch (err) {
        console.debug('Polling live price error', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activePosition, soundEnabled]);

  // Scanner Core Execution
  const runScanner = useCallback(async () => {
    if (isScanning) return;
    setIsScanning(true);

    try {
      // 1. Fetch 24h Ticker statistics
      const tickerMap = await fetch24hTickers(marketType);

      // 2. Fetch candles and evaluate confluence concurrently
      const evaluatedList = await batchScanCandles<ConfirmedSetup | null>(
        symbols,
        5, // concurrency
        async (sym) => {
          try {
            const candles = await fetchKlines(sym, timeframe, 210, marketType);
            const ticker = tickerMap.get(sym);
            const change24h = ticker?.changePercent || 0;
            const baseAsset = sym.replace('USDT', '');
            return evaluateQuantitativeConfluence(
              candles,
              sym,
              baseAsset,
              marketType,
              timeframe,
              change24h
            );
          } catch (err) {
            return null;
          }
        }
      );

      const validEvaluations = evaluatedList.filter((x): x is ConfirmedSetup => x !== null);

      const confirmed = validEvaluations.filter((s) => s.criteria.isConfirmed);
      const unconfirmed = validEvaluations.filter((s) => !s.criteria.isConfirmed);

      // Sort confirmed: 5/5 stars first, then highest volume ratio
      confirmed.sort((a, b) => {
        if (b.criteria.score !== a.criteria.score) {
          return b.criteria.score - a.criteria.score;
        }
        return b.volumeRatio - a.volumeRatio;
      });

      // Sort unconfirmed by score descending
      unconfirmed.sort((a, b) => b.criteria.score - a.criteria.score);

      // Check for brand new confirmed symbol
      const currentConfirmedSymbols = new Set(confirmed.map((s) => s.symbol));
      let brandNewSymbol: string | null = null;

      for (const sym of currentConfirmedSymbols) {
        if (!knownConfirmedSymbolsRef.current.has(sym)) {
          brandNewSymbol = sym;
          break;
        }
      }

      if (brandNewSymbol) {
        setNewAlertSymbol(brandNewSymbol);
        if (soundEnabled) {
          const match = confirmed.find((s) => s.symbol === brandNewSymbol);
          playSignalAlertSound(match?.direction || 'LONG');
        }
        // Clear alert banner after 8 seconds
        setTimeout(() => {
          setNewAlertSymbol(null);
        }, 8000);
      }

      knownConfirmedSymbolsRef.current = currentConfirmedSymbols;

      // Calculate Market Pulse
      const totalCount = validEvaluations.length || 1;
      const bullishCount = validEvaluations.filter((s) => s.direction === 'LONG').length;
      const bearishCount = validEvaluations.filter((s) => s.direction === 'SHORT').length;
      const totalVolRatio = validEvaluations.reduce((acc, s) => acc + s.volumeRatio, 0);
      const avgVol = totalCount > 0 ? Number((totalVolRatio / totalCount).toFixed(1)) : 1.0;

      setMarketPulse({
        totalScanned: validEvaluations.length,
        confirmedCount: confirmed.length,
        bullishDominance: Number(((bullishCount / totalCount) * 100).toFixed(1)),
        bearishDominance: Number(((bearishCount / totalCount) * 100).toFixed(1)),
        neutralCount: symbols.length - validEvaluations.length,
        avgVolumeSurge: avgVol,
        lastUpdated: Date.now()
      });

      setConfirmedSetups(confirmed);
      setUnconfirmedSetups(unconfirmed);
      setLastScanTime(Date.now());
    } catch (err) {
      console.error('Scan execution error:', err);
    } finally {
      setIsScanning(false);
      setCountdown(refreshIntervalSeconds);
    }
  }, [symbols, timeframe, marketType, refreshIntervalSeconds, soundEnabled, isScanning]);

  // Initial scan & on timeframe/market change
  useEffect(() => {
    runScanner();
  }, [timeframe, marketType, symbols.length]);

  // Auto-refresh timer loop
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isAutoRefreshActive) return;

      setCountdown((prev) => {
        if (prev <= 1) {
          runScanner();
          return refreshIntervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAutoRefreshActive, refreshIntervalSeconds, runScanner]);

  // Backtest Launcher Handler
  const handleOpenBacktest = async (setup: ConfirmedSetup, tab: 'results' | 'python' = 'results') => {
    setSelectedSetupForBacktest(setup);
    setModalTab(tab);
    setIsBacktestModalOpen(true);
    setIsBacktesting(true);

    try {
      const candles = await fetchKlines(setup.symbol, setup.timeframe, 400, setup.marketType);
      const res = runVectorizedSimulation(candles, setup.symbol, setup.timeframe);
      setBacktestResult(res);
    } catch (err) {
      console.error('Backtest calculation failed:', err);
      setBacktestResult(null);
    } finally {
      setIsBacktesting(false);
    }
  };

  // Add Custom Symbol to watchlist
  const handleAddSymbol = (e: React.FormEvent) => {
    e.preventDefault();
    let cleaned = customSymbolInput.trim().toUpperCase();
    if (!cleaned) return;
    if (!cleaned.endsWith('USDT')) {
      cleaned = `${cleaned}USDT`;
    }
    if (!symbols.includes(cleaned)) {
      setSymbols([cleaned, ...symbols]);
      setCustomSymbolInput('');
    }
  };

  // Enter 20x Futures Paper Trade Handler ($10 margin, 20x leverage)
  const handleEnterPaperTrade = (setup: ConfirmedSetup) => {
    if (activePosition) {
      handleClosePosition();
    }

    const margin = 10.0;
    const leverage = 20;
    const notionalSize = 200.0;
    const isLong = setup.direction === 'LONG';
    const entryPrice = setup.livePrice;

    // ~5% adverse move for liquidation
    const liquidationPrice = isLong ? entryPrice * 0.95 : entryPrice * 1.05;
    const takeProfitPrice = setup.target1.price;
    const stopLossPrice = setup.stopLoss.price;

    const newPos: ActivePosition = {
      id: `pos-${Date.now()}`,
      symbol: setup.symbol,
      baseAsset: setup.baseAsset,
      direction: setup.direction,
      entryPrice,
      currentPrice: entryPrice,
      margin,
      leverage,
      notionalSize,
      liquidationPrice: Number(liquidationPrice.toFixed(6)),
      takeProfitPrice: Number(takeProfitPrice.toFixed(6)),
      stopLossPrice: Number(stopLossPrice.toFixed(6)),
      pnlPercent: 0,
      pnlDollar: 0,
      openedAt: Date.now(),
      lastUpdatedAt: Date.now()
    };

    setDemoBalance((prev) => Math.max(0, Number((prev - margin).toFixed(2))));
    setActivePosition(newPos);
    if (soundEnabled) playSignalAlertSound(setup.direction);
  };

  // Manual Close 20x Futures Position Handler
  const handleClosePosition = () => {
    if (!activePosition) return;

    const finalPnlDollar = activePosition.pnlDollar;
    const finalPnlPercent = activePosition.pnlPercent;

    const closed: ClosedTrade = {
      id: activePosition.id,
      symbol: activePosition.symbol,
      direction: activePosition.direction,
      entryPrice: activePosition.entryPrice,
      exitPrice: activePosition.currentPrice,
      margin: activePosition.margin,
      leverage: activePosition.leverage,
      notionalSize: activePosition.notionalSize,
      pnlDollar: finalPnlDollar,
      pnlPercent: finalPnlPercent,
      outcome: 'MANUAL_CLOSE',
      outcomeTextAr: '⚪ إغلاق يدوي',
      openedAt: activePosition.openedAt,
      closedAt: Date.now()
    };

    setClosedTrades((prev) => [closed, ...prev]);
    setDemoBalance((prev) => Number((prev + activePosition.margin + finalPnlDollar).toFixed(2)));
    setActivePosition(null);
  };

  const handleClearTradeHistory = () => {
    setClosedTrades([]);
  };

  // Filter confirmed setups by search and direction
  const filteredConfirmed = confirmedSetups.filter((s) => {
    const matchesSearch = s.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDirection = directionFilter === 'ALL' || s.direction === directionFilter;
    return matchesSearch && matchesDirection;
  });

  const filteredUnconfirmed = unconfirmedSetups.filter((s) => {
    const matchesSearch = s.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDirection = directionFilter === 'ALL' || s.direction === directionFilter;
    return matchesSearch && matchesDirection;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* Top Navigation & Status */}
      <Header
        timeframe={timeframe}
        setTimeframe={setTimeframe}
        marketType={marketType}
        setMarketType={setMarketType}
        confirmedOnly={confirmedOnly}
        setConfirmedOnly={setConfirmedOnly}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        isAutoRefreshActive={isAutoRefreshActive}
        setIsAutoRefreshActive={setIsAutoRefreshActive}
        refreshIntervalSeconds={refreshIntervalSeconds}
        setRefreshIntervalSeconds={setRefreshIntervalSeconds}
        countdown={countdown}
        isScanning={isScanning}
        onManualScan={runScanner}
        isArabic={isArabic}
        setIsArabic={setIsArabic}
        onOpenGlobalScript={() => {
          if (confirmedSetups.length > 0) {
            handleOpenBacktest(confirmedSetups[0], 'python');
          } else {
            const fallbackSetup: ConfirmedSetup = {
              symbol: 'BTCUSDT',
              baseAsset: 'BTC',
              marketType,
              direction: 'LONG',
              timeframe,
              livePrice: 84000,
              triggerPrice: 83900,
              priceDriftPercent: 0.12,
              entryStatus: 'IMMEDIATE',
              volumeRatio: 2.3,
              volumeScore: 82,
              volumeVerdict: 'INSTITUTIONAL',
              volumeVerdictTextAr: '🟢 فوليوم مؤسسي قوي',
              target1: { price: 86100, percent: 2.5 },
              target2: { price: 88200, percent: 5.0 },
              stopLoss: { price: 82990, percent: 1.2 },
              riskRewardRatio: 2.1,
              netEvPercent: 2.33,
              rsi: 58.4,
              ema9: 83950,
              ema21: 83600,
              ema200: 82100,
              atr: 1400,
              criteria: {
                trend: true,
                volume: true,
                rsi: true,
                freshness: true,
                volatilityRR: true,
                score: 5,
                isConfirmed: true,
                rejectionReasons: []
              },
              updatedAt: Date.now()
            };
            handleOpenBacktest(fallbackSetup, 'python');
          }
        }}
        onOpenTelegram={() => setIsTelegramModalOpen(true)}
      />

      {/* Main Quantitative Workstation */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full space-y-6">
        
        {/* Market Pulse Banner */}
        <MarketPulseBanner
          pulse={marketPulse}
          isArabic={isArabic}
          newAlertSymbol={newAlertSymbol}
          onOpenTelegram={() => setIsTelegramModalOpen(true)}
        />

        {/* 20x Futures Paper Trading Active Engine Panel */}
        <ActivePositionPanel
          position={activePosition}
          balance={demoBalance}
          isArabic={isArabic}
          onClosePosition={handleClosePosition}
          lastPollTimestamp={lastPollTimestamp}
        />

        {/* Search, Direction Filters & Custom Symbol Ingestion */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
          
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className={`w-4 h-4 text-zinc-500 absolute top-1/2 -translate-y-1/2 ${isArabic ? 'right-3' : 'left-3'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isArabic ? 'ابحث عن زوج (مثال: BTC, SOL, SUI)...' : 'Search pair (e.g. BTC, SOL, SUI)...'}
                className={`w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono-num ${
                  isArabic ? 'pr-9 pl-3' : 'pl-9 pr-3'
                }`}
              />
            </div>

            {/* Direction Filter Toggle */}
            <div className="flex bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => setDirectionFilter('ALL')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  directionFilter === 'ALL'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {isArabic ? 'الكل' : 'All'}
              </button>
              <button
                type="button"
                onClick={() => setDirectionFilter('LONG')}
                className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition-colors ${
                  directionFilter === 'LONG'
                    ? 'bg-emerald-600 text-white'
                    : 'text-emerald-400 hover:text-emerald-300'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>LONG</span>
              </button>
              <button
                type="button"
                onClick={() => setDirectionFilter('SHORT')}
                className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition-colors ${
                  directionFilter === 'SHORT'
                    ? 'bg-rose-600 text-white'
                    : 'text-rose-400 hover:text-rose-300'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>SHORT</span>
              </button>
            </div>
          </div>

          {/* Add Pair to Scan Form */}
          <form onSubmit={handleAddSymbol} className="flex items-center gap-2">
            <input
              type="text"
              value={customSymbolInput}
              onChange={(e) => setCustomSymbolInput(e.target.value)}
              placeholder={isArabic ? '+ أضف زوج (TIA)' : '+ Add Pair (TIA)'}
              className="bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 px-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 uppercase font-mono-num w-32"
            />
            <button
              type="submit"
              className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
              title="إضافة الزوج للمراقبة الفورية"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isArabic ? 'إضافة' : 'Add'}</span>
            </button>
          </form>

        </div>

        {/* Gatekeeper Criteria Rule Explainer Header */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-3.5 text-xs text-zinc-400 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold text-zinc-200">
              {isArabic ? 'قوانين البوابة الكمية الصارمة (Strict 4/5 Confluence):' : 'Rigid Gatekeeper Rules (4/5 Confluence):'}
            </span>
            <span>
              {isArabic
                ? '1. اتجاه EMA 200/9/21 · 2. فوليوم > 1.8x · 3. مؤشر RSI (52-68 / 32-48) · 4. انزلاق < 0.5% · 5. تذبذب ATR و RR ≥ 1.5'
                : '1. EMA 200/9/21 · 2. Volume > 1.8x SMA20 · 3. RSI Sweet Spot · 4. Slippage < 0.5% · 5. ATR Volatility & RR ≥ 1.5'}
            </span>
          </div>

          <div className="text-[11px] font-mono-num text-zinc-500 shrink-0">
            {isArabic ? 'آخر تحديث:' : 'Updated:'} {new Date(lastScanTime).toLocaleTimeString()}
          </div>
        </div>

        {/* Confirmed Cards Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-wide uppercase text-zinc-200 flex items-center gap-2">
                <span>{isArabic ? 'الصفقات المؤكدة كمياً (Confirmed Alpha Setups)' : 'Confirmed Quantitative Setups'}</span>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono-num text-xs">
                  {filteredConfirmed.length}
                </span>
              </h2>
            </div>
            
            {confirmedOnly && (
              <span className="text-xs text-zinc-400">
                {isArabic ? 'تم تفعيل حارس الجودة الصارم (4/5 و 5/5 فقط)' : 'Strict Confluence Gatekeeper Active'}
              </span>
            )}
          </div>

          {filteredConfirmed.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredConfirmed.map((setup) => (
                <SetupCard
                  key={`${setup.symbol}-${setup.direction}-${setup.timeframe}`}
                  setup={setup}
                  isArabic={isArabic}
                  onOpenBacktest={(s) => handleOpenBacktest(s, 'results')}
                  onOpenScript={(s) => handleOpenBacktest(s, 'python')}
                  onEnterPaperTrade={handleEnterPaperTrade}
                />
              ))}
            </div>
          ) : (
            /* Explicit Gatekeeper Safe Guard State when no coins meet 4/5 criteria */
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="max-w-lg mx-auto space-y-2">
                <h3 className="text-base font-bold text-white">
                  {isArabic
                    ? '🛡️ البوابة الكمية تعمل بصرامة: لا توجد إشارات ضعيفة أو مضاربات مشبوهة'
                    : '🛡️ Strict Gatekeeper Active: No Weak or Speculative Setups Passed'}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {isArabic
                    ? 'جميع العملات المفحوصة حالياً لم تحقق 4 من 5 شروط للتأكيد المؤسسي (مثل ضعف الفوليوم أقل من 1.8x أو تشبع RSI أو الانزلاق السعري). هذا يحمي حسابك من الدخول العشوائي والكسر الكاذب.'
                    : 'None of the scanned coins currently meet at least 4 out of 5 institutional criteria (e.g. low volume < 1.8x, overbought RSI, or high slippage). This protects your capital from fakeouts.'}
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmedOnly(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
                >
                  {isArabic ? 'عرض قائمة المراقبة وتشخيص أسباب الاستبعاد' : 'View Monitored Watchlist & Rejection Reasons'}
                </button>
                <button
                  type="button"
                  onClick={runScanner}
                  disabled={isScanning}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {isArabic ? 'إعادة الفحص الآن' : 'Scan Live Market Now'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 20x Futures Trade History Table */}
        <TradeHistoryTable
          trades={closedTrades}
          isArabic={isArabic}
          onClearHistory={handleClearTradeHistory}
        />

        {/* Diagnostics Table (Shown when Confirmed Only is toggled OFF, or for rejected coins inspection) */}
        {!confirmedOnly && (
          <div className="space-y-3 pt-4">
            <DiagnosticsTable
              unconfirmedSetups={filteredUnconfirmed}
              isArabic={isArabic}
              onOpenBacktest={(s) => handleOpenBacktest(s, 'results')}
              onOpenScript={(s) => handleOpenBacktest(s, 'python')}
            />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-4 px-4 text-center text-xs text-zinc-500 font-mono-num">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            STRICT ALPHA SCANNER · QUANTITATIVE ARCHITECTURE · BINANCE SPOT & FUTURES
          </div>
          <div>
            ENFORCED TAKER FEE: 0.06% · SLIPPAGE: 0.05% · 70/30 TRAIN-TEST SPLIT
          </div>
        </div>
      </footer>

      {/* Interactive Backtest & Vectorbt Python Script Modal */}
      {isBacktestModalOpen && selectedSetupForBacktest && (
        <BacktestModal
          setup={selectedSetupForBacktest}
          backtestResult={backtestResult}
          isLoading={isBacktesting}
          isArabic={isArabic}
          onClose={() => setIsBacktestModalOpen(false)}
          initialTab={modalTab}
        />
      )}

      {/* Standalone Telegram Dispatcher Script Modal */}
      {isTelegramModalOpen && (
        <TelegramModal
          isArabic={isArabic}
          onClose={() => setIsTelegramModalOpen(false)}
        />
      )}

    </div>
  );
}
