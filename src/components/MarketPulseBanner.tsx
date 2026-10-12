import React from 'react';
import { MarketPulse } from '../types/scanner';
import { TrendingUp, TrendingDown, Zap, ShieldCheck, Activity } from 'lucide-react';

interface Props {
  pulse: MarketPulse;
  isArabic: boolean;
  newAlertSymbol?: string | null;
  onOpenTelegram?: () => void;
}

export const MarketPulseBanner: React.FC<Props> = ({ pulse, isArabic, newAlertSymbol, onOpenTelegram }) => {
  const isBullDominant = pulse.bullishDominance >= pulse.bearishDominance;

  return (
    <div className="space-y-3">
      {/* Flashing Alert Beacon Banner when new signal arrives */}
      {newAlertSymbol && (
        <div className="bg-emerald-950/80 border border-emerald-500/50 p-3 rounded-lg flex items-center justify-between text-emerald-200 animate-pulse transition-all">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div className="text-sm font-semibold">
              {isArabic ? (
                <>
                  ⚡ إشارة جديدة مؤكدة تم رصدها الآن على زوج: <span className="font-mono-num text-white bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-500/40 text-base">{newAlertSymbol}</span>
                </>
              ) : (
                <>
                  ⚡ Brand-New Confirmed Setup Detected: <span className="font-mono-num text-white bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-500/40 text-base">{newAlertSymbol}</span>
                </>
              )}
            </div>
          </div>
          <span className="text-xs uppercase font-mono-num bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded border border-emerald-500/30">
            {isArabic ? 'تطابق الشروط 4/5+' : '4/5+ Confluence'}
          </span>
        </div>
      )}

      {/* Market Pulse Metric Bar */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Market Sentiment & Dominance */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  {isArabic ? 'نبض وتوجه سوق بينانس العام (Market Pulse)' : 'Binance Market Pulse & Dominance'}
                </span>
              </div>
              <div className="text-xs font-mono-num flex items-center gap-3">
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {isArabic ? 'صعود:' : 'BULL:'} {pulse.bullishDominance.toFixed(1)}%
                </span>
                <span className="text-zinc-600">|</span>
                <span className="text-rose-400 flex items-center gap-1 font-medium">
                  <TrendingDown className="w-3.5 h-3.5" />
                  {isArabic ? 'هبوط:' : 'BEAR:'} {pulse.bearishDominance.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Visual Balance Bar */}
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 transition-all duration-700 ease-out"
                style={{ width: `${pulse.bullishDominance}%` }}
                title={`Bullish: ${pulse.bullishDominance}%`}
              />
              <div
                className="bg-rose-500 transition-all duration-700 ease-out"
                style={{ width: `${pulse.bearishDominance}%` }}
                title={`Bearish: ${pulse.bearishDominance}%`}
              />
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3 lg:border-s lg:border-zinc-800 lg:ps-6">
            <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/80">
              <div className="text-[11px] text-zinc-400 mb-0.5">
                {isArabic ? 'الصفقات المؤكدة' : 'Confirmed Setups'}
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-mono-num font-bold text-lg text-emerald-400">
                  {pulse.confirmedCount}
                </span>
                <span className="text-xs text-zinc-500">/ {pulse.totalScanned}</span>
              </div>
            </div>

            <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/80">
              <div className="text-[11px] text-zinc-400 mb-0.5">
                {isArabic ? 'متوسط اندفاع الفوليوم' : 'Avg Vol Surge'}
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="font-mono-num font-bold text-lg text-amber-300">
                  {pulse.avgVolumeSurge.toFixed(1)}x
                </span>
                <span className="text-[10px] text-zinc-500">SMA20</span>
              </div>
            </div>

            <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/80">
              <div className="text-[11px] text-zinc-400 mb-0.5">
                {isArabic ? 'حالة التداول' : 'Market Bias'}
              </div>
              <div className="text-xs font-semibold mt-1">
                {isBullDominant ? (
                  <span className="text-emerald-400">
                    {isArabic ? '🟢 هيمنة شرائية' : '🟢 Bull Dominance'}
                  </span>
                ) : (
                  <span className="text-rose-400">
                    {isArabic ? '🔴 هيمنة بيعية' : '🔴 Bear Dominance'}
                  </span>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Telegram Quick-Action Banner */}
      <div className="bg-gradient-to-r from-blue-950/50 via-indigo-950/40 to-zinc-900/80 border border-blue-500/40 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-lg shadow-blue-950/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 text-lg shrink-0">
            ✈️
          </div>
          <div>
            <div className="font-bold text-white flex items-center gap-2">
              <span>{isArabic ? 'رادار تيليجرام اللحظي جاهز للعمل:' : 'Instant Telegram Radar is Online:'}</span>
              <a
                href="https://t.me/newalfaabot"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono-num text-blue-300 bg-blue-900/60 hover:bg-blue-800/80 px-2 py-0.5 rounded border border-blue-400/40 transition-colors"
              >
                @newalfaabot
              </a>
            </div>
            <p className="text-zinc-400 text-[11px] mt-0.5">
              {isArabic
                ? 'اضغط لفتح البوت في تطبيق تيليجرام مباشرة لتحليل أي عملة أو استقبال الإشعارات اللحظية.'
                : 'Click to open the bot on Telegram for instant coin scans and 4/5 confluence alerts.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <a
            href="https://t.me/newalfaabot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-initial py-2 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 text-xs"
          >
            <span>{isArabic ? 'فتح البوت في تيليجرام' : 'Open in Telegram'}</span>
            <span>↗</span>
          </a>
          {onOpenTelegram && (
            <button
              type="button"
              onClick={onOpenTelegram}
              className="py-2 px-3.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold border border-zinc-700 transition-colors text-xs"
            >
              {isArabic ? 'إعدادات وكود البوت' : 'Bot Code & Config'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
