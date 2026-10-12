export type MarketType = 'FUTURES' | 'SPOT';
export type Timeframe = '15m' | '1h';
export type Direction = 'LONG' | 'SHORT';

export interface RawCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
}

export interface ConfluenceCriteria {
  trend: boolean;
  volume: boolean;
  rsi: boolean;
  freshness: boolean;
  volatilityRR: boolean;
  score: number; // 0 to 5
  isConfirmed: boolean; // score >= 4
  rejectionReasons: string[];
}

export interface ConfirmedSetup {
  symbol: string;
  baseAsset: string;
  marketType: MarketType;
  direction: Direction;
  timeframe: Timeframe;
  livePrice: number;
  triggerPrice: number;
  priceDriftPercent: number;
  entryStatus: 'IMMEDIATE' | 'EXPIRED'; // "متاح للدخول الفوري" vs "فاتك الدخول"
  volumeRatio: number;
  volumeScore: number;
  volumeVerdict: 'INSTITUTIONAL' | 'MODERATE' | 'WEAK_FAKEOUT';
  volumeVerdictTextAr: string;
  target1: {
    price: number;
    percent: number;
  };
  target2: {
    price: number;
    percent: number;
  };
  stopLoss: {
    price: number;
    percent: number;
  };
  riskRewardRatio: number;
  netEvPercent: number; // After 0.06% fees roundtrip + slippage
  rsi: number;
  ema9: number;
  ema21: number;
  ema200: number;
  atr: number;
  criteria: ConfluenceCriteria;
  updatedAt: number;
  isNew?: boolean;
}

export interface MarketPulse {
  totalScanned: number;
  confirmedCount: number;
  bullishDominance: number; // percentage
  bearishDominance: number; // percentage
  neutralCount: number;
  avgVolumeSurge: number;
  topGainer24h?: { symbol: string; change: number };
  topConfluenceSymbol?: string;
  lastUpdated: number;
}

export interface BacktestResult {
  symbol: string;
  timeframe: Timeframe;
  trainTestSplit: {
    trainRatio: number; // 0.70
    trainBars: number;
    testBars: number;
  };
  inSample: {
    totalTrades: number;
    winRate: number;
    profitFactor: number;
    totalReturnPercent: number;
    maxDrawdownPercent: number;
    sharpeRatio: number;
  };
  outOfSample: {
    totalTrades: number;
    winRate: number;
    profitFactor: number;
    totalReturnPercent: number;
    maxDrawdownPercent: number;
    sharpeRatio: number;
  };
  feesDeductedPercent: number; // e.g. 0.06% per trade = 0.12% per roundtrip
  slippageDeductedPercent: number;
  equityCurve: Array<{ time: string; inSampleReturn: number; outOfSampleReturn?: number }>;
}
