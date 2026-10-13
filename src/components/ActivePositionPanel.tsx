import React from 'react';
import { ActivePosition } from '../types/paperTrading';
import { 
  TrendingUp, 
  TrendingDown, 
  XOctagon, 
  Target, 
  ShieldAlert, 
  AlertTriangle, 
  DollarSign, 
  Percent, 
  Clock, 
  Zap 
} from 'lucide-react';

interface Props {
  position: ActivePosition | null;
  balance: number;
  isArabic: boolean;
  onClosePosition: () => void;
  lastPollTimestamp: number;
}

export const ActivePositionPanel: React.FC<Props> = ({
  position,
  balance,
  isArabic,
  onClosePosition,
  lastPollTimestamp
}) => {
  if (!position) {
    return (
      <div className="bg-[#090d16] border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-black shrink-0">
            20x
          </div>
          <div>
            <div className="font-bold text-white flex items-center gap-2">
              <span>{isArabic ? 'محرك محاكاة عقود الفيوتشر (20x Futures Paper Engine)' : '20x Futures Paper Trading Engine'}</span>
              <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-mono-num text-[11px]">
                {isArabic ? 'جاهز للتنفيذ' : 'IDLE / READY'}
              </span>
            </div>
            <p className="text-zinc-400 text-[11px] mt-0.5">
              {isArabic
                ? 'الهامش ثابت 10.00$ لكل صفقة · الرافعة 20x معزولة · حجم العقد 200.00$ · تصفية عند انزلاق 5%'
                : 'Fixed Margin $10.00 · 20x Isolated Leverage · Position Size $200.00 · Liquidation at 5% move'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono-num bg-zinc-950/80 px-3 py-2 rounded-lg border border-zinc-800">
          <div>
            <span className="text-zinc-500 block text-[10px]">{isArabic ? 'رصيد المحفظة التجريبية' : 'Demo Balance'}</span>
            <span className="font-bold text-emerald-400 text-sm">${balance.toFixed(2)}</span>
          </div>
          <div className="border-s border-zinc-800 ps-3">
            <span className="text-zinc-500 block text-[10px]">{isArabic ? 'قيمة العقد القادم' : 'Next Notional Size'}</span>
            <span className="font-bold text-zinc-200 text-sm">$200.00</span>
          </div>
        </div>
      </div>
    );
  }

  const isLong = position.direction === 'LONG';
  const isProfitable = position.pnlPercent >= 0;

  // Calculate distance to TP, SL, and Liquidation in percent
  const distToLiqPercent = Math.abs(((position.currentPrice - position.liquidationPrice) / position.currentPrice) * 100);

  return (
    <div className={`rounded-xl border p-4 transition-all duration-300 relative overflow-hidden ${
      isProfitable
        ? 'bg-[#090d16] border-emerald-500/50 shadow-lg shadow-emerald-950/30'
        : 'bg-[#090d16] border-rose-500/50 shadow-lg shadow-rose-950/30'
    }`}>
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          {/* Direction Badge */}
          <div className={`px-2.5 py-1 rounded-lg text-xs font-black tracking-wider flex items-center gap-1.5 ${
            isLong
              ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
              : 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
          }`}>
            {isLong ? <TrendingUp className="w-4 h-4 stroke-[2.5]" /> : <TrendingDown className="w-4 h-4 stroke-[2.5]" />}
            <span>{isLong ? 'LONG 20x' : 'SHORT 20x'}</span>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold font-mono-num text-white">
                {position.symbol}
              </span>
              <span className="text-xs text-zinc-400 font-mono-num">
                {isArabic ? 'هامش معزول:' : 'Isolated Margin:'} <b className="text-zinc-200">${position.margin.toFixed(2)}</b>
              </span>
              <span className="text-xs text-zinc-400 font-mono-num">
                ({isArabic ? 'حجم العقد:' : 'Size:'} <b className="text-amber-300">${position.notionalSize.toFixed(2)}</b>)
              </span>
            </div>
          </div>
        </div>

        {/* Live Polling Signal & Manual Close Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] font-mono-num text-zinc-400">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>{isArabic ? 'محدّث لحظياً (3s)' : 'Live 3s Polling'}</span>
          </div>

          {/* Red Manual Close Button */}
          <button
            type="button"
            onClick={onClosePosition}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/30 border border-rose-400"
          >
            <XOctagon className="w-4 h-4" />
            <span>{isArabic ? '🔴 إغلاق الصفقة الآن' : '🔴 Close Position Now'}</span>
          </button>
        </div>
      </div>

      {/* Numerical Matrix Data Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-3 text-xs font-mono-num">
        {/* Entry Price */}
        <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
          <span className="text-zinc-500 block text-[10px] uppercase">{isArabic ? 'سعر الدخول' : 'Entry Price'}</span>
          <span className="font-bold text-white text-sm">
            ${position.entryPrice >= 1 ? position.entryPrice.toFixed(2) : position.entryPrice.toFixed(4)}
          </span>
        </div>

        {/* Live Price */}
        <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
          <span className="text-zinc-500 block text-[10px] uppercase">{isArabic ? 'السعر اللحظي' : 'Live Price'}</span>
          <span className={`font-bold text-sm ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
            ${position.currentPrice >= 1 ? position.currentPrice.toFixed(2) : position.currentPrice.toFixed(4)}
          </span>
        </div>

        {/* Real-Time PnL Dollar */}
        <div className={`p-2.5 rounded-lg border ${
          isProfitable ? 'bg-emerald-950/40 border-emerald-500/40' : 'bg-rose-950/40 border-rose-500/40'
        }`}>
          <span className="text-zinc-400 block text-[10px] uppercase">{isArabic ? 'الربح / الخسارة بالدولار' : 'Unrealized PnL ($)'}</span>
          <span className={`font-black text-base ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isProfitable ? '+' : ''}${position.pnlDollar.toFixed(2)} USD
          </span>
        </div>

        {/* Real-Time PnL Percent (ROE 20x) */}
        <div className={`p-2.5 rounded-lg border ${
          isProfitable ? 'bg-emerald-950/40 border-emerald-500/40' : 'bg-rose-950/40 border-rose-500/40'
        }`}>
          <span className="text-zinc-400 block text-[10px] uppercase">{isArabic ? 'العائد على الهامش (ROE %)' : 'ROE (20x %)'}</span>
          <span className={`font-black text-base ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isProfitable ? '+' : ''}{position.pnlPercent.toFixed(2)}%
          </span>
        </div>

        {/* Take Profit Target */}
        <div className="bg-zinc-950 p-2.5 rounded-lg border border-emerald-500/20">
          <span className="text-emerald-400 block text-[10px] uppercase flex items-center gap-1">
            <Target className="w-3 h-3" />
            <span>{isArabic ? 'الهدف (TP)' : 'Take Profit'}</span>
          </span>
          <span className="font-bold text-emerald-300 text-sm">
            ${position.takeProfitPrice >= 1 ? position.takeProfitPrice.toFixed(2) : position.takeProfitPrice.toFixed(4)}
          </span>
        </div>

        {/* Stop Loss & Liquidation */}
        <div className="bg-zinc-950 p-2.5 rounded-lg border border-rose-500/20">
          <span className="text-rose-400 block text-[10px] uppercase flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" />
            <span>{isArabic ? 'الوقف / التصفية' : 'SL / Liq'}</span>
          </span>
          <span className="font-bold text-rose-300 text-sm">
            SL: ${position.stopLossPrice >= 1 ? position.stopLossPrice.toFixed(2) : position.stopLossPrice.toFixed(4)}
          </span>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            {isArabic ? 'تصفية عند:' : 'Liq:'} ${position.liquidationPrice >= 1 ? position.liquidationPrice.toFixed(2) : position.liquidationPrice.toFixed(4)}
          </div>
        </div>
      </div>
    </div>
  );
};
