import { RawCandle, BacktestResult, Timeframe } from '../types/scanner';
import { calculateEMA, calculateRSI, calculateSMA } from './indicators';

/**
 * Fast client-side vectorized backtest simulation on real candles
 * Enforces Train (70%) / Test (30%) split, 0.06% fees, and slippage
 */
export function runVectorizedSimulation(
  candles: RawCandle[],
  symbol: string,
  timeframe: Timeframe,
  takerFee: number = 0.0006, // 0.06%
  slippage: number = 0.0005 // 0.05%
): BacktestResult {
  const n = candles.length;
  const splitIndex = Math.floor(n * 0.7);

  const closes = candles.map((c) => c.close);
  const volumes = candles.map((c) => c.volume);

  const ema9 = calculateEMA(closes, 9);
  const ema21 = calculateEMA(closes, 21);
  const ema200 = calculateEMA(closes, 200);
  const rsi = calculateRSI(closes, 14);
  const volSma20 = calculateSMA(volumes, 20);

  // Vectorized signals
  // 1: Long, -1: Short, 0: Neutral
  const signals: number[] = new Array(n).fill(0);

  for (let i = 200; i < n; i++) {
    const p = closes[i];
    const e9 = ema9[i];
    const e21 = ema21[i];
    const e200 = ema200[i];
    const r = rsi[i];
    const v = volumes[i];
    const vs = volSma20[i];
    const vRatio = vs > 0 ? v / vs : 1;

    // Strict Long Confluence
    if (p > e200 && e9 > e21 && vRatio >= 1.8 && r >= 52 && r <= 68) {
      signals[i] = 1;
    }
    // Strict Short Confluence
    else if (p < e200 && e9 < e21 && vRatio >= 1.8 && r >= 32 && r <= 48) {
      signals[i] = -1;
    }
  }

  // Simulate execution with position holding
  interface Trade {
    entryPrice: number;
    exitPrice: number;
    direction: 1 | -1;
    pnlPercent: number;
    isWin: boolean;
  }

  function simulatePartition(startIndex: number, endIndex: number) {
    const trades: Trade[] = [];
    let currentPos: { direction: 1 | -1; entryPrice: number; barIndex: number } | null = null;
    let equity = 10000;
    const equityHistory: number[] = [equity];

    for (let i = startIndex; i < endIndex; i++) {
      const sig = signals[i];
      const price = closes[i];

      // Check exit or flip
      if (currentPos) {
        const holdBars = i - currentPos.barIndex;
        const rawReturn = currentPos.direction === 1
          ? (price - currentPos.entryPrice) / currentPos.entryPrice
          : (currentPos.entryPrice - price) / currentPos.entryPrice;

        // Dynamic exit conditions: TP reached (+2.5%), SL reached (-1.2%), or signal changed, or held 8 bars
        const shouldExit = rawReturn >= 0.025 || rawReturn <= -0.012 || (sig !== 0 && sig !== currentPos.direction) || holdBars >= 10;

        if (shouldExit || i === endIndex - 1) {
          // Deduct fees (entry + exit = 2 * 0.06% = 0.12%) and slippage
          const totalCost = (takerFee * 2) + (slippage * 2);
          const netReturn = rawReturn - totalCost;
          const pnlDollars = equity * netReturn;
          equity += pnlDollars;
          equityHistory.push(equity);

          trades.push({
            entryPrice: currentPos.entryPrice,
            exitPrice: price,
            direction: currentPos.direction,
            pnlPercent: netReturn * 100,
            isWin: netReturn > 0
          });
          currentPos = null;
        }
      }

      // Enter new trade
      if (!currentPos && (sig === 1 || sig === -1)) {
        const effectiveEntry: number = sig === 1 ? price * (1 + slippage) : price * (1 - slippage);
        currentPos = {
          direction: sig as 1 | -1,
          entryPrice: effectiveEntry,
          barIndex: i
        };
      }
    }

    const totalTrades = trades.length;
    const wins = trades.filter((t) => t.isWin);
    const winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;
    const grossWins = wins.reduce((acc, t) => acc + t.pnlPercent, 0);
    const grossLosses = Math.abs(trades.filter((t) => !t.isWin).reduce((acc, t) => acc + t.pnlPercent, 0));
    const profitFactor = grossLosses > 0 ? grossWins / grossLosses : (grossWins > 0 ? 3.5 : 1.0);
    const totalReturnPercent = ((equity - 10000) / 10000) * 100;

    // Max drawdown
    let peak = equityHistory[0];
    let maxDd = 0;
    for (const eq of equityHistory) {
      if (eq > peak) peak = eq;
      const dd = (peak - eq) / peak;
      if (dd > maxDd) maxDd = dd;
    }

    // Sharpe approximation
    const tradeReturns = trades.map((t) => t.pnlPercent);
    const mean = tradeReturns.length > 0 ? tradeReturns.reduce((a, b) => a + b, 0) / tradeReturns.length : 0;
    const variance = tradeReturns.length > 1
      ? tradeReturns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (tradeReturns.length - 1)
      : 1;
    const std = Math.sqrt(variance) || 1;
    const sharpeRatio = (mean / std) * Math.sqrt(365 * 4); // Annualized approximation

    return {
      totalTrades,
      winRate: Number(winRate.toFixed(1)),
      profitFactor: Number(profitFactor.toFixed(2)),
      totalReturnPercent: Number(totalReturnPercent.toFixed(2)),
      maxDrawdownPercent: Number((maxDd * 100).toFixed(2)),
      sharpeRatio: Number(sharpeRatio.toFixed(2)),
      equityHistory
    };
  }

  const inSample = simulatePartition(200, splitIndex);
  const outOfSample = simulatePartition(splitIndex, n);

  // Generate combined equity curve points
  const equityCurve: Array<{ time: string; inSampleReturn: number; outOfSampleReturn?: number }> = [];
  const inSampleSteps = Math.min(20, inSample.equityHistory.length);
  for (let i = 0; i < inSampleSteps; i++) {
    const idx = Math.floor((i / inSampleSteps) * inSample.equityHistory.length);
    const eq = inSample.equityHistory[idx] || 10000;
    equityCurve.push({
      time: `IS-${i + 1}`,
      inSampleReturn: Number((((eq - 10000) / 10000) * 100).toFixed(2))
    });
  }

  const outSampleSteps = Math.min(15, outOfSample.equityHistory.length);
  for (let i = 0; i < outSampleSteps; i++) {
    const idx = Math.floor((i / outSampleSteps) * outOfSample.equityHistory.length);
    const eq = outOfSample.equityHistory[idx] || 10000;
    equityCurve.push({
      time: `OOS-${i + 1}`,
      inSampleReturn: inSample.totalReturnPercent,
      outOfSampleReturn: Number((((eq - 10000) / 10000) * 100).toFixed(2))
    });
  }

  return {
    symbol,
    timeframe,
    trainTestSplit: {
      trainRatio: 0.7,
      trainBars: splitIndex - 200,
      testBars: n - splitIndex
    },
    inSample: {
      totalTrades: inSample.totalTrades,
      winRate: inSample.winRate,
      profitFactor: inSample.profitFactor,
      totalReturnPercent: inSample.totalReturnPercent,
      maxDrawdownPercent: inSample.maxDrawdownPercent,
      sharpeRatio: inSample.sharpeRatio
    },
    outOfSample: {
      totalTrades: outOfSample.totalTrades,
      winRate: outOfSample.winRate,
      profitFactor: outOfSample.profitFactor,
      totalReturnPercent: outOfSample.totalReturnPercent,
      maxDrawdownPercent: outOfSample.maxDrawdownPercent,
      sharpeRatio: outOfSample.sharpeRatio
    },
    feesDeductedPercent: Number((takerFee * 100).toFixed(3)),
    slippageDeductedPercent: Number((slippage * 100).toFixed(3)),
    equityCurve
  };
}

/**
 * Generates production-ready, complete Python script using vectorbt, pandas, numpy
 * Strictly adheres to 0.06% fees, slippage, and 70/30 Train/Test split
 */
export function generatePythonVectorbtScript(symbol: string = 'BTCUSDT', timeframe: Timeframe = '15m'): string {
  return `"""
================================================================================
STRICT ALPHA SCANNER - QUANTITATIVE VECTORIZED STRATEGY & BACKTEST
Architecture: Vectorized Multi-Factor Gatekeeper (vectorbt + pandas + numpy)
Asset: ${symbol} | Timeframe: ${timeframe}
Enforced Costs: 0.06% Taker Fee + 0.05% Slippage
Dataset Split: In-Sample (Train 70%) vs Out-of-Sample (Test 30%)
================================================================================
"""

import numpy as np
import pandas as pd
import vectorbt as vbt
import requests
import datetime

# ------------------------------------------------------------------------------
# 1. LIVE DATA INGESTION (BINANCE PUBLIC API)
# ------------------------------------------------------------------------------
def fetch_binance_klines(symbol: str = "${symbol}", interval: str = "${timeframe}", limit: int = 1000) -> pd.DataFrame:
    url = f"https://api.binance.com/api/v3/klines?symbol={symbol}&interval={interval}&limit={limit}"
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    raw_data = response.json()
    
    cols = [
        "timestamp", "open", "high", "low", "close", "volume",
        "close_time", "quote_volume", "trades", "taker_base", "taker_quote", "ignore"
    ]
    df = pd.DataFrame(raw_data, columns=cols)
    
    # Cast numerical columns
    numeric_cols = ["open", "high", "low", "close", "volume", "quote_volume"]
    df[numeric_cols] = df[numeric_cols].astype(np.float64)
    
    # Format index
    df["datetime"] = pd.to_datetime(df["timestamp"], unit="ms")
    df.set_index("datetime", inplace=True)
    return df[["open", "high", "low", "close", "volume"]]

print("[*] Fetching live data for ${symbol} (${timeframe})...")
ohlcv = fetch_binance_klines()
print(f"[+] Loaded {len(ohlcv)} bars from {ohlcv.index[0]} to {ohlcv.index[-1]}")

# ------------------------------------------------------------------------------
# 2. VECTORIZED INDICATOR COMPUTATIONS (PANDAS / NUMPY)
# ------------------------------------------------------------------------------
close = ohlcv["close"]
volume = ohlcv["volume"]

# EMA 9, 21, 200
ema9 = close.ewm(span=9, adjust=False).mean()
ema21 = close.ewm(span=21, adjust=False).mean()
ema200 = close.ewm(span=200, adjust=False).mean()

# Volume SMA 20
vol_sma20 = volume.rolling(window=20).mean()
vol_ratio = volume / vol_sma20

# Relative Strength Index (RSI 14)
delta = close.diff()
gain = delta.clip(lower=0)
loss = -delta.clip(upper=0)
avg_gain = gain.ewm(alpha=1/14, adjust=False).mean()
avg_loss = loss.ewm(alpha=1/14, adjust=False).mean()
rs = avg_gain / avg_loss.replace(0, np.nan)
rsi14 = 100.0 - (100.0 / (1.0 + rs))
rsi14 = rsi14.fillna(50.0)

# ------------------------------------------------------------------------------
# 3. STRICT QUANTITATIVE CONFLUENCE LOGIC (VECTORIZED MASKS)
# ------------------------------------------------------------------------------
# Criterion 1: Directional Trend Engine
trend_long = (close > ema200) & (ema9 > ema21)
trend_short = (close < ema200) & (ema9 < ema21)

# Criterion 2: Institutional Volume Expansion (> 1.8x SMA20)
vol_expansion = vol_ratio >= 1.8

# Criterion 3: Momentum Sweet Spot (Non-overbought / Non-oversold)
rsi_long_sweet = (rsi14 >= 52) & (rsi14 <= 68)
rsi_short_sweet = (rsi14 >= 32) & (rsi14 <= 48)

# Strict Entry Triggers
long_entries = trend_long & vol_expansion & rsi_long_sweet
short_entries = trend_short & vol_expansion & rsi_short_sweet

# Clean Exit Conditions: Trend crossover or reversal
long_exits = (ema9 < ema21) | (rsi14 >= 72)
short_exits = (ema9 > ema21) | (rsi14 <= 28)

# ------------------------------------------------------------------------------
# 4. MANDATORY TRAIN / TEST SPLIT (70% IN-SAMPLE / 30% OUT-OF-SAMPLE)
# ------------------------------------------------------------------------------
total_bars = len(ohlcv)
split_idx = int(total_bars * 0.70)

# In-Sample Slices
is_close = close.iloc[:split_idx]
is_long_entries = long_entries.iloc[:split_idx]
is_long_exits = long_exits.iloc[:split_idx]

# Out-of-Sample Slices
oos_close = close.iloc[split_idx:]
oos_long_entries = long_entries.iloc[split_idx:]
oos_long_exits = long_exits.iloc[split_idx:]

# ------------------------------------------------------------------------------
# 5. REALISTIC EXECUTION WITH VECTORBT (0.06% FEES & SLIPPAGE)
# ------------------------------------------------------------------------------
FEE_RATE = 0.0006       # 0.06% Binance Taker Fee
SLIPPAGE_RATE = 0.0005  # 0.05% Realistic Slippage

print("\\n" + "=" * 60)
print(">>> IN-SAMPLE BACKTEST (TRAIN: 70% OF BARS) <<<")
print("=" * 60)
is_portfolio = vbt.Portfolio.from_signals(
    close=is_close,
    entries=is_long_entries,
    exits=is_long_exits,
    fees=FEE_RATE,
    slippage=SLIPPAGE_RATE,
    init_cash=10_000,
    freq="${timeframe}"
)
print(is_portfolio.stats([
    "Start", "End", "Duration", "Total Return [%]", "Benchmark Return [%]",
    "Max Drawdown [%]", "Win Rate [%]", "Profit Factor", "Sharpe Ratio"
]))

print("\\n" + "=" * 60)
print(">>> OUT-OF-SAMPLE BACKTEST (TEST: 30% OF BARS - PREVENT OVERFITTING) <<<")
print("=" * 60)
oos_portfolio = vbt.Portfolio.from_signals(
    close=oos_close,
    entries=oos_long_entries,
    exits=oos_long_exits,
    fees=FEE_RATE,
    slippage=SLIPPAGE_RATE,
    init_cash=10_000,
    freq="${timeframe}"
)
print(oos_portfolio.stats([
    "Start", "End", "Duration", "Total Return [%]", "Benchmark Return [%]",
    "Max Drawdown [%]", "Win Rate [%]", "Profit Factor", "Sharpe Ratio"
]))

print("\\n[+] Backtest complete. Metrics account for 0.06% fees and slippage.")
`;
}
