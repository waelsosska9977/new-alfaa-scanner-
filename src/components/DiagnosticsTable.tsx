import React from 'react';
import { ConfirmedSetup } from '../types/scanner';
import { AlertCircle, TrendingUp, TrendingDown, Layers, Play, Code2 } from 'lucide-react';

interface Props {
  unconfirmedSetups: ConfirmedSetup[];
  isArabic: boolean;
  onOpenBacktest: (setup: ConfirmedSetup) => void;
  onOpenScript: (setup: ConfirmedSetup) => void;
}

export const DiagnosticsTable: React.FC<Props> = ({
  unconfirmedSetups,
  isArabic,
  onOpenBacktest,
  onOpenScript
}) => {
  if (unconfirmedSetups.length === 0) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center text-zinc-500 text-sm">
        {isArabic
          ? 'لا توجد عملات مستبعدة حالياً. جميع العملات المفحوصة مؤكدة أو جاري تحديثها.'
          : 'No rejected coins found currently. All monitored pairs passed or are refreshing.'}
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-zinc-200">
            {isArabic ? 'سجل العملات المستبعدة وتشخيص أسباب الرفض (Watchlist & Gatekeeper Diagnostics)' : 'Watchlist & Gatekeeper Diagnostics (Near Misses & Filtered Pairs)'}
          </h3>
        </div>
        <span className="text-xs font-mono-num text-zinc-400">
          {unconfirmedSetups.length} {isArabic ? 'أزواج مستبعدة' : 'pairs filtered'}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-start">
          <thead className="bg-zinc-950 text-zinc-400 font-semibold border-b border-zinc-800">
            <tr>
              <th className="py-3 px-4 text-start">{isArabic ? 'الزوج' : 'Symbol'}</th>
              <th className="py-3 px-4 text-start">{isArabic ? 'الاتجاه المقترح' : 'Bias'}</th>
              <th className="py-3 px-4 text-start">{isArabic ? 'السعر اللحظي' : 'Live Price'}</th>
              <th className="py-3 px-4 text-start">{isArabic ? 'الفوليوم vs SMA20' : 'Vol Ratio'}</th>
              <th className="py-3 px-4 text-start">RSI(14)</th>
              <th className="py-3 px-4 text-start">{isArabic ? 'النقاط المحققة' : 'Score'}</th>
              <th className="py-3 px-4 text-start">{isArabic ? 'أسباب الاستبعاد الكمي (Gatekeeper Rejections)' : 'Gatekeeper Rejection Reasons'}</th>
              <th className="py-3 px-4 text-end">{isArabic ? 'إجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-mono-num">
            {unconfirmedSetups.map((setup) => {
              const isLong = setup.direction === 'LONG';
              return (
                <tr key={setup.symbol} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-white">
                    {setup.symbol}
                  </td>
                  <td className="py-3 px-4">
                    {isLong ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400">
                        <TrendingUp className="w-3.5 h-3.5" /> LONG
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-400">
                        <TrendingDown className="w-3.5 h-3.5" /> SHORT
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-zinc-300">
                    ${setup.livePrice >= 1 ? setup.livePrice.toFixed(2) : setup.livePrice.toFixed(6)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={setup.volumeRatio >= 1.8 ? 'text-amber-300' : 'text-zinc-400'}>
                      {setup.volumeRatio}x
                    </span>
                  </td>
                  <td className="py-3 px-4 text-zinc-300">
                    {setup.rsi}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-amber-400 border border-zinc-700">
                      {setup.criteria.score}/5
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <div className="flex flex-wrap gap-1">
                      {setup.criteria.rejectionReasons.map((reason, idx) => (
                        <span
                          key={idx}
                          className="bg-rose-950/40 text-rose-300 border border-rose-500/20 px-2 py-0.5 rounded text-[11px]"
                        >
                          ❌ {reason}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-end font-sans">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onOpenBacktest(setup)}
                        className="p-1.5 hover:bg-zinc-700 rounded text-zinc-300 transition-colors"
                        title="اختبار الأداء"
                      >
                        <Play className="w-3.5 h-3.5 text-emerald-400" />
                      </button>
                      <button
                        onClick={() => onOpenScript(setup)}
                        className="p-1.5 hover:bg-zinc-700 rounded text-zinc-300 transition-colors"
                        title="كود بايثون"
                      >
                        <Code2 className="w-3.5 h-3.5 text-blue-400" />
                      </button>
                    </div>
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
