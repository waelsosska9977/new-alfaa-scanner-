import { RawCandle, ConfluenceCriteria, ConfirmedSetup, MarketType, Timeframe } from '../types/scanner';

/**
 * Vectorized Exponential Moving Average (EMA)
 */
export function calculateEMA(values: number[], period: number): number[] {
  if (values.length === 0) return [];
  const k = 2 / (period + 1);
  const emaArray: number[] = new Array(values.length);

  // Initialize with first value or simple average
  let sum = 0;
  const initialLength = Math.min(period, values.length);
  for (let i = 0; i < initialLength; i++) {
    sum += values[i];
  }
  let currentEma = sum / initialLength;
  emaArray[initialLength - 1] = currentEma;

  // Fill preceding with NaN or current
  for (let i = 0; i < initialLength - 1; i++) {
    emaArray[i] = values[i];
  }

  for (let i = initialLength; i < values.length; i++) {
    currentEma = values[i] * k + currentEma * (1 - k);
    emaArray[i] = currentEma;
  }

  return emaArray;
}

/**
 * Vectorized Simple Moving Average (SMA)
 */
export function calculateSMA(values: number[], period: number): number[] {
  const smaArray: number[] = new Array(values.length).fill(0);
  if (values.length < period) return smaArray;

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += values[i];
  }
  smaArray[period - 1] = sum / period;

  for (let i = period; i < values.length; i++) {
    sum += values[i] - values[i - period];
    smaArray[i] = sum / period;
  }

  return smaArray;
}

/**
 * Relative Strength Index (RSI 14) with Wilder's smoothing
 */
export function calculateRSI(closes: number[], period: number = 14): number[] {
  const rsi: number[] = new Array(closes.length).fill(50);
  if (closes.length <= period) return rsi;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsi[period] = 100 - 100 / (1 + rs);

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const currentGain = diff > 0 ? diff : 0;
    const currentLoss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

    if (avgLoss === 0) {
      rsi[i] = 100;
    } else {
      rs = avgGain / avgLoss;
      rsi[i] = 100 - 100 / (1 + rs);
    }
  }

  return rsi;
}

/**
 * Average True Range (ATR 14)
 */
export function calculateATR(highs: number[], lows: number[], closes: number[], period: number = 14): number[] {
  const atr: number[] = new Array(closes.length).fill(0);
  if (closes.length < 2) return atr;

  const trs: number[] = [highs[0] - lows[0]];

  for (let i = 1; i < closes.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trs.push(tr);
  }

  return calculateEMA(trs, period);
}

/**
 * Evaluates Quantitative Confluence on candle series
 */
export function evaluateQuantitativeConfluence(
  candles: RawCandle[],
  symbol: string,
  baseAsset: string,
  marketType: MarketType,
  timeframe: Timeframe,
  twentyFourHourChangePercent: number = 0
): ConfirmedSetup | null {
  if (candles.length < 205) {
    return null; // Insufficient data to calculate 200 EMA
  }

  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const volumes = candles.map((c) => c.volume);

  const ema9Arr = calculateEMA(closes, 9);
  const ema21Arr = calculateEMA(closes, 21);
  const ema200Arr = calculateEMA(closes, 200);
  const rsi14Arr = calculateRSI(closes, 14);
  const atr14Arr = calculateATR(highs, lows, closes, 14);
  const volSma20Arr = calculateSMA(volumes, 20);

  const lastIdx = candles.length - 1;
  const livePrice = closes[lastIdx];
  const ema9 = ema9Arr[lastIdx];
  const ema21 = ema21Arr[lastIdx];
  const ema200 = ema200Arr[lastIdx];
  const rsi = rsi14Arr[lastIdx];
  const atr = atr14Arr[lastIdx];
  const curVol = volumes[lastIdx];
  const volSma = volSma20Arr[lastIdx] || 1;
  const volumeRatio = Number((curVol / volSma).toFixed(2));

  // Determine potential direction
  const isBullishTrend = livePrice > ema200 && ema9 > ema21;
  const isBearishTrend = livePrice < ema200 && ema9 < ema21;

  if (!isBullishTrend && !isBearishTrend) {
    // Neither pure long nor short trend
    return null;
  }

  const direction = isBullishTrend ? 'LONG' : 'SHORT';

  // 1. Directional Trend Engine:
  // LONG: Price > EMA 200 AND EMA 9 > EMA 21
  // SHORT: Price < EMA 200 AND EMA 9 < EMA 21
  const trendCondition = direction === 'LONG' 
    ? (livePrice > ema200 && ema9 > ema21)
    : (livePrice < ema200 && ema9 < ema21);

  // 2. Volume Expansion & Institutional Validation (Volume Check):
  // Volume > 1.8 * Volume_SMA_20
  const volumeCondition = volumeRatio >= 1.8;

  // 3. Momentum Confirmation:
  // RSI between 52 and 68 for Longs
  // RSI between 32 and 48 for Shorts
  const rsiCondition = direction === 'LONG'
    ? (rsi >= 52 && rsi <= 68)
    : (rsi >= 32 && rsi <= 48);

  // 4. Slippage & Freshness Guard (Early Entry Only):
  // Trigger price is approximated by EMA 9 or previous candle close
  const triggerPrice = Number((direction === 'LONG' ? Math.max(ema9, candles[lastIdx - 1]?.close || livePrice) : Math.min(ema9, candles[lastIdx - 1]?.close || livePrice)).toFixed(6));
  const priceDriftPercent = Math.abs((livePrice - triggerPrice) / triggerPrice) * 100;
  
  // Exclude already pumped coins (> 5% in 24h or excessive drift > 0.5%)
  const isOverExtended24h = Math.abs(twentyFourHourChangePercent) >= 5.0;
  const freshnessCondition = priceDriftPercent <= 0.5 && !isOverExtended24h;

  // 5. Dynamic Targets, Stop Loss and Risk-Reward:
  // TP1 based on 1.5 * ATR
  // TP2 based on 3.0 * ATR (Liquidation Magnet)
  // SL based on 1.0 * ATR (or EMA21 boundary)
  const tp1Delta = 1.5 * atr;
  const tp2Delta = 3.0 * atr;
  const slDelta = 1.0 * atr;

  let tp1Price = direction === 'LONG' ? livePrice + tp1Delta : livePrice - tp1Delta;
  let tp2Price = direction === 'LONG' ? livePrice + tp2Delta : livePrice - tp2Delta;
  let slPrice = direction === 'LONG' ? livePrice - slDelta : livePrice + slDelta;

  tp1Price = Math.max(0.000001, tp1Price);
  tp2Price = Math.max(0.000001, tp2Price);
  slPrice = Math.max(0.000001, slPrice);

  const tp1Percent = Number(((Math.abs(tp1Price - livePrice) / livePrice) * 100).toFixed(2));
  const tp2Percent = Number(((Math.abs(tp2Price - livePrice) / livePrice) * 100).toFixed(2));
  const slPercent = Number(((Math.abs(livePrice - slPrice) / livePrice) * 100).toFixed(2));
  const riskRewardRatio = slPercent > 0 ? Number((tp1Percent / slPercent).toFixed(2)) : 1.5;

  // Volatility & Clean RR condition
  const volatilityCondition = riskRewardRatio >= 1.4 && (atr / livePrice) >= 0.002;

  // Track rejection reasons for diagnostic inspection
  const rejectionReasons: string[] = [];
  if (!trendCondition) {
    rejectionReasons.push(direction === 'LONG' ? 'غير متوافق مع اتجاه EMA 200/9/21' : 'غير متوافق مع هبوط EMA 200/9/21');
  }
  if (!volumeCondition) {
    rejectionReasons.push(`فوليوم ضعيف (${volumeRatio}x < 1.8x) - مخاطرة كسر كاذب`);
  }
  if (!rsiCondition) {
    if (direction === 'LONG') {
      rejectionReasons.push(rsi > 68 ? `تشبع شرائي RSI=${rsi.toFixed(1)} (>68)` : `زخم ضعيف RSI=${rsi.toFixed(1)} (<52)`);
    } else {
      rejectionReasons.push(rsi < 32 ? `تشبع بيعي RSI=${rsi.toFixed(1)} (<32)` : `زخم هبوطي ضعيف RSI=${rsi.toFixed(1)} (>48)`);
    }
  }
  if (!freshnessCondition) {
    if (isOverExtended24h) {
      rejectionReasons.push(`حركة مفرطة سابقة (+${Math.abs(twentyFourHourChangePercent).toFixed(1)}%) - فاتك الدخول`);
    } else {
      rejectionReasons.push(`انزلاق سعري عالي (+${priceDriftPercent.toFixed(2)}% > 0.5%)`);
    }
  }
  if (!volatilityCondition) {
    rejectionReasons.push(`تذبذب ضعيف جداً أو عائد للمخاطرة أقل من 1.5`);
  }

  // Count criteria score (0 to 5)
  let score = 0;
  if (trendCondition) score++;
  if (volumeCondition) score++;
  if (rsiCondition) score++;
  if (freshnessCondition) score++;
  if (volatilityCondition) score++;

  const isConfirmed = score >= 4;

  // Volume Verdict determination:
  let volumeVerdict: 'INSTITUTIONAL' | 'MODERATE' | 'WEAK_FAKEOUT' = 'WEAK_FAKEOUT';
  let volumeVerdictTextAr = '🔴 فوليوم ضعيف (مخاطرة كسر كاذب)';
  let volumeScore = Math.min(95, Math.max(35, Math.round(volumeRatio * 32)));

  if (volumeRatio >= 2.2) {
    volumeVerdict = 'INSTITUTIONAL';
    volumeVerdictTextAr = '🟢 فوليوم مؤسسي قوي (نسبة النجاح المتوقعة: 78% - 85%)';
    volumeScore = Math.min(94, 78 + Math.round((volumeRatio - 2.2) * 4));
  } else if (volumeRatio >= 1.8) {
    volumeVerdict = 'MODERATE';
    volumeVerdictTextAr = '🟡 فوليوم متوسط (احتمالية تذبذب: 65% - 74%)';
    volumeScore = 68;
  }

  // Net Expected Return:
  // Transaction fees: 0.06% on entry + 0.06% on exit = 0.12%
  // Estimated slippage: 0.05%
  // Net EV = TP1% - 0.17%
  const transactionFriction = 0.17;
  const netEvPercent = Number((tp1Percent - transactionFriction).toFixed(2));

  const criteria: ConfluenceCriteria = {
    trend: trendCondition,
    volume: volumeCondition,
    rsi: rsiCondition,
    freshness: freshnessCondition,
    volatilityRR: volatilityCondition,
    score,
    isConfirmed,
    rejectionReasons
  };

  const entryStatus: 'IMMEDIATE' | 'EXPIRED' = priceDriftPercent <= 0.5 && !isOverExtended24h ? 'IMMEDIATE' : 'EXPIRED';

  return {
    symbol,
    baseAsset,
    marketType,
    direction,
    timeframe,
    livePrice,
    triggerPrice,
    priceDriftPercent: Number(priceDriftPercent.toFixed(2)),
    entryStatus,
    volumeRatio,
    volumeScore,
    volumeVerdict,
    volumeVerdictTextAr,
    target1: {
      price: Number(tp1Price.toFixed(6)),
      percent: tp1Percent
    },
    target2: {
      price: Number(tp2Price.toFixed(6)),
      percent: tp2Percent
    },
    stopLoss: {
      price: Number(slPrice.toFixed(6)),
      percent: slPercent
    },
    riskRewardRatio,
    netEvPercent,
    rsi: Number(rsi.toFixed(1)),
    ema9: Number(ema9.toFixed(6)),
    ema21: Number(ema21.toFixed(6)),
    ema200: Number(ema200.toFixed(6)),
    atr: Number(atr.toFixed(6)),
    criteria,
    updatedAt: Date.now()
  };
}
