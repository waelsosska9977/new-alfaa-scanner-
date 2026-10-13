import React from 'react';
import { ClosedTrade } from '../types/paperTrading';
import { History, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';

interface Props {
  trades: ClosedTrade[];
  isArabic: boolean;
  onClearHistory: () => void;
}

export const TradeHistoryTable: React.FC<Props> = ({ trades, isArabic, onClearHistory }) => {
  if (trades.length === 0) {
    return null;
  }

  const totalNetDollar = trades.reduce((acc, t) => acc + t.pnlDollar, 0);
  const totalWins = trades.filter((t) => t.pnlDollar > 0).length;
  const winRate = Number(((totalWins / trades.length) * 100).toFixed(1));

  return (
    <div className="bg-[#090d16] border border-zinc-800 rounded-xl overflow-hidden text-xs">
      {/* Header bar */}
      <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-white text-sm">
            {isArabic ? 'سجل صفقات الفيوتشر المنفذة (20x Trade History)' : '20x Futures Trade History'}
          </h3>
          <span className="bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono-num text-[11px]">
            {trades.length} {isArabic ? 'صفقات' : 'trades'}
          </span>
        </div>

        {/* Stats summary & Clear button */}
        <div className="flex items-center gap-4 font-mono-num">
          <div>
            <span className="text-zinc-500 text-[10px] me-1">{isArabic ? 'نسبة الفوز:' : 'Win Rate:'}</span>
            <span className="font-bold text-white">{winRate}%</span>
          </div>

          <div className="border-s border-zinc-800 ps-3">
            <span className="text-zinc-500 text-[10px] me-1">{isArabic ? 'صافي الأرباح:' : 'Total PnL:'}</span>
            <span className={`font-black ${totalNetDollar >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalNetDollar >= 0 ? '+' : ''}${totalNetDollar.toFixed(2)} USD
            </span>
          </div>

          <button
            type="button"
            onClick={onClearHistory}
            className="p-1 hover:bg-zinc-800 text-zinc-500 hover:text-rose-400 rounded transition-colors"
            title="مسح السجل"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-start">
          <thead className="bg-zinc-950/90 text-zinc-400 font-semibold border-b border-zinc-800/80 text-[11px]">
            <tr>
              <th className="py-2.5 px-3.5 text-start">{isArabic ? 'العملة' : 'Coin'}</th>
              <th className="py-2.5 px-3.5 text-start">{isArabic ? 'النوع والرافعة' : 'Type / Leverage'}</th>
              <th className="py-2.5 px-3.5 text-start">{isArabic ? 'الهامش' : 'Margin'}</th>
              <th className="py-2.5 px-3.5 text-start">{isArabic ? 'سعر الدخول' : 'Entry Price'}</th>
              <th className="py-2.5 px-3.5 text-start">{isArabic ? 'سعر الإغلاق' : 'Exit Price'}</th>
              <th className="py-2.5 px-3.5 text-start">{isArabic ? 'الربح / الخسارة ($)' : 'Net PnL ($)'}</th>
              <th className="py-2.5 px-3.5 text-start">{isArabic ? 'العائد (ROE %)' : 'ROE %'}</th>
              <th className="py-2.5 px-3.5 text-end">{isArabic ? 'النتيجة' : 'Outcome'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50 font-mono-num text-[11px]">
            {trades.map((trade) => {
              const isWin = trade.pnlDollar > 0;
              const isLong = trade.direction === 'LONG';
              return (
                <tr key={trade.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-2.5 px-3.5 font-bold text-white">
                    {trade.symbol}
                  </td>
                  <td className="py-2.5 px-3.5">
                    <span className={`inline-flex items-center gap-1 font-semibold ${
                      isLong ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {isLong ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {trade.direction} 20x
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-zinc-300">
                    ${trade.margin.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3.5 text-zinc-300">
                    ${trade.entryPrice >= 1 ? trade.entryPrice.toFixed(2) : trade.entryPrice.toFixed(4)}
                  </td>
                  <td className="py-2.5 px-3.5 text-zinc-300">
                    ${trade.exitPrice >= 1 ? trade.exitPrice.toFixed(2) : trade.exitPrice.toFixed(4)}
                  </td>
                  <td className="py-2.5 px-3.5">
                    <span className={`font-bold ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isWin ? '+' : ''}${trade.pnlDollar.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5">
                    <span className={`font-bold ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isWin ? '+' : ''}{trade.pnlPercent.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-end font-sans">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                      trade.outcome === 'TP_HIT'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        : trade.outcome === 'SL_HIT'
                        ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                        : trade.outcome === 'LIQUIDATED'
                        ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                        : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                    }`}>
                      {trade.outcomeTextAr}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
