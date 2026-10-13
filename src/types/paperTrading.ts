import { Direction } from './scanner';

export type TradeOutcome = 'TP_HIT' | 'SL_HIT' | 'LIQUIDATED' | 'MANUAL_CLOSE';

export interface ActivePosition {
  id: string;
  symbol: string;
  baseAsset: string;
  direction: Direction;
  entryPrice: number;
  currentPrice: number;
  margin: number; // Exactly $10.00
  leverage: number; // 20x
  notionalSize: number; // $200.00
  liquidationPrice: number; // ~5% adverse move
  takeProfitPrice: number; // TP1 or 3.0*ATR
  stopLossPrice: number; // 1.5*ATR
  pnlPercent: number; // ROE % = ((diff / entry) * 100 * 20)
  pnlDollar: number; // $10 * (pnlPercent / 100)
  openedAt: number;
  lastUpdatedAt: number;
}

export interface ClosedTrade {
  id: string;
  symbol: string;
  direction: Direction;
  entryPrice: number;
  exitPrice: number;
  margin: number; // $10.00
  leverage: number; // 20x
  notionalSize: number; // $200.00
  pnlDollar: number;
  pnlPercent: number;
  outcome: TradeOutcome;
  outcomeTextAr: string;
  openedAt: number;
  closedAt: number;
}
