import React, { useState } from 'react';
import { ConfirmedSetup } from '../types/scanner';
import { 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Play, 
  Code2, 
  Target, 
  ShieldAlert, 
  Clock, 
  Layers,
  Zap
} from 'lucide-react';

interface Props {
  setup: ConfirmedSetup;
  isArabic: boolean;
  onOpenBacktest: (setup: ConfirmedSetup) => void;
  onOpenScript: (setup: ConfirmedSetup) => void;
  onEnterPaperTrade?: (setup: ConfirmedSetup) => void;
}

export const SetupCard: React.FC<Props> = ({ setup, isArabic, onOpenBacktest, onOpenScript, onEnterPaperTrade }) => {
  const [showMatrixDetails, setShowMatrixDetails] = useState(false);
  const isLong = setup.direction === 'LONG';
  const isImmediate = setup.entryStatus === 'IMMEDIATE';
  const isUltra5Star = setup.criteria.score === 5;

  const binanceUrl = setup.marketType === 'FUTURES'
    ? `https://www.binance.com/en/futures/${setup.symbol}`
    : `https://www.binance.com/en/trade/${setup.baseAsset}_USDT`;

  return (
    <div
      className={`relative rounded-xl border transition-all duration-200 overflow-hidden ${
        isLong
          ? 'bg-zinc-900/90 border-emerald-500/30 hover:border-emerald-500/60 shadow-lg shadow-emerald-950/20'
          : 'bg-zinc-900/90 border-rose-500/30 hover:border-rose-500/60 shadow-lg shadow-rose-950/20'
      }`}
    >
      {/* Top Banner / Confluence Badge */}
      <div className={`px-4 py-2 border-b flex items-center justify-between ${
        isLong ? 'bg-emerald-950/40 border-emerald-500/20' : 'bg-rose-950/40 border-rose-500/20'
      }`}>
        <div className="flex items-center gap-2">
          {isUltra5Star ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              🌟 {isArabic ? 'تطابق فائق التأكيد (5/5 Ultra Alpha)' : '5/5 Ultra Alpha Confluence'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              ✅ {isArabic ? 'مؤكد بالقواعد (4/5 Confluence)' : '4/5 Confirmed Confluence'}
            </span>
          )}
          <span className="text-[11px] font-mono-num text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded">
            {setup.marketType} · {setup.timeframe}
          </span>
        </div>

        {/* Live Freshness Status Badge */}
        <div className="flex items-center gap-1.5">
          {isImmediate ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              {isArabic ? 'متاح للدخول الفوري' : 'Entry Available Now'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/40">
              <Clock className="w-3 h-3" />
              {isArabic ? 'فاتك الدخول (انزلاق زائد)' : 'Chased / Expired Entry'}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Row 1: Symbol & Direction Badge */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-xl font-bold font-mono-num text-white tracking-wide">
                {setup.symbol.replace('USDT', '')}<span className="text-zinc-500 text-sm">/USDT</span>
              </h3>
              <span className="text-xs text-zinc-400 font-mono-num">
                ${setup.livePrice >= 1 ? setup.livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : setup.livePrice.toFixed(6)}
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
              <span>{isArabic ? 'سعر إشارة الانطلاق:' : 'Signal Trigger:'}</span>
              <span className="font-mono-num text-zinc-300 font-medium">
                ${setup.triggerPrice >= 1 ? setup.triggerPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : setup.triggerPrice.toFixed(6)}
              </span>
              <span className={`font-mono-num ms-1 px-1 rounded text-[10px] ${
                setup.priceDriftPercent <= 0.5 ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
              }`}>
                {setup.priceDriftPercent > 0 ? `+${setup.priceDriftPercent}%` : `${setup.priceDriftPercent}%`} {isArabic ? 'فارق' : 'drift'}
              </span>
            </div>
          </div>

          {/* Prominent Direction Badge */}
          <div>
            {isLong ? (
              <div className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center gap-1.5 font-bold text-sm tracking-wide shadow-sm">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>{isArabic ? '🚀 صعود قوي - LONG' : '🚀 STRONG - LONG'}</span>
              </div>
            ) : (
              <div className="px-3 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 flex items-center gap-1.5 font-bold text-sm tracking-wide shadow-sm">
                <TrendingDown className="w-4 h-4 text-rose-400" />
                <span>{isArabic ? '🔻 هبوط قوي - SHORT' : '🔻 STRONG - SHORT'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Volume Success Probability (هل ستنجح مع الفوليوم أم لا؟) */}
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <span className="text-sm">📊</span>
              {isArabic ? 'احتمالية النجاح مع الفوليوم (هل ستنجح؟):' : 'Volume Success Probability:'}
            </span>
            <span className="font-mono-num text-xs font-bold px-2 py-0.5 rounded bg-zinc-800 text-amber-300 border border-zinc-700">
              {setup.volumeRatio}x {isArabic ? 'فوق المتوسط' : 'vs SMA20'}
            </span>
          </div>

          <div className="text-xs font-medium py-1 px-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-200">
            {setup.volumeVerdictTextAr}
          </div>

          {/* Volume progress meter */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  setup.volumeVerdict === 'INSTITUTIONAL'
                    ? 'bg-emerald-400'
                    : setup.volumeVerdict === 'MODERATE'
                    ? 'bg-amber-400'
                    : 'bg-rose-400'
                }`}
                style={{ width: `${Math.min(100, Math.max(20, setup.volumeScore))}%` }}
              />
            </div>
            <span className="font-mono-num text-[11px] text-zinc-400 font-semibold">
              {setup.volumeScore}%
            </span>
          </div>
        </div>

        {/* Row 3: Expected Gain & Numerical Matrix (TP1 / TP2 / SL / RR / Net EV) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          {/* Target 1 */}
          <div className="bg-emerald-950/30 border border-emerald-500/20 p-2.5 rounded-lg">
            <div className="text-[11px] text-zinc-400 flex items-center justify-center gap-1 mb-0.5">
              <Target className="w-3 h-3 text-emerald-400" />
              <span>{isArabic ? 'هدف 1 (TP1)' : 'Target 1'}</span>
            </div>
            <div className="font-mono-num font-bold text-emerald-400 text-sm">
              +{setup.target1.percent}%
            </div>
            <div className="text-[10px] font-mono-num text-zinc-500">
              ${setup.target1.price >= 1 ? setup.target1.price.toFixed(2) : setup.target1.price.toFixed(4)}
            </div>
          </div>

          {/* Target 2 */}
          <div className="bg-emerald-950/40 border border-emerald-500/30 p-2.5 rounded-lg">
            <div className="text-[11px] text-zinc-400 flex items-center justify-center gap-1 mb-0.5">
              <Target className="w-3 h-3 text-emerald-300" />
              <span>{isArabic ? 'هدف 2 (مغناطيس)' : 'Target 2'}</span>
            </div>
            <div className="font-mono-num font-bold text-emerald-300 text-sm">
              +{setup.target2.percent}%
            </div>
            <div className="text-[10px] font-mono-num text-zinc-500">
              ${setup.target2.price >= 1 ? setup.target2.price.toFixed(2) : setup.target2.price.toFixed(4)}
            </div>
          </div>

          {/* Stop Loss */}
          <div className="bg-rose-950/30 border border-rose-500/20 p-2.5 rounded-lg">
            <div className="text-[11px] text-zinc-400 flex items-center justify-center gap-1 mb-0.5">
              <ShieldAlert className="w-3 h-3 text-rose-400" />
              <span>{isArabic ? 'وقف الخسارة (SL)' : 'Stop Loss'}</span>
            </div>
            <div className="font-mono-num font-bold text-rose-400 text-sm">
              -{setup.stopLoss.percent}%
            </div>
            <div className="text-[10px] font-mono-num text-zinc-500">
              ${setup.stopLoss.price >= 1 ? setup.stopLoss.price.toFixed(2) : setup.stopLoss.price.toFixed(4)}
            </div>
          </div>

          {/* Risk-Reward & Net EV */}
          <div className="bg-zinc-950/70 border border-zinc-800 p-2.5 rounded-lg">
            <div className="text-[11px] text-zinc-400 mb-0.5">
              {isArabic ? 'عائد : مخاطرة' : 'Risk : Reward'}
            </div>
            <div className="font-mono-num font-bold text-white text-sm">
              1 : {setup.riskRewardRatio}
            </div>
            <div className="text-[10px] font-mono-num text-emerald-400" title="صافي القيمة المتوقعة بعد خصم الرسوم 0.06% والانزلاق">
              {isArabic ? 'صافي:' : 'Net:'} +{setup.netEvPercent}%
            </div>
          </div>
        </div>

        {/* 50x Liquidation Magnet Strip */}
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-lg p-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <span>🧲</span>
            <span className="font-semibold text-zinc-300">{isArabic ? 'مغناطيس الليكوديتي (50x):' : '50x Liq Magnets:'}</span>
          </div>
          <div className="flex items-center gap-3 font-mono-num text-[11px]">
            <span className="text-emerald-400" title="تصفية الشورت - مغناطيس صعود">
              {isArabic ? 'شورت:' : 'Short Liq:'} ${(setup.livePrice * 1.02) >= 1 ? (setup.livePrice * 1.02).toFixed(2) : (setup.livePrice * 1.02).toFixed(4)} (+2%)
            </span>
            <span className="text-zinc-600">|</span>
            <span className="text-rose-400" title="تصفية اللونغ - مصيدة هبوط">
              {isArabic ? 'لونغ:' : 'Long Liq:'} ${(setup.livePrice * 0.98) >= 1 ? (setup.livePrice * 0.98).toFixed(2) : (setup.livePrice * 0.98).toFixed(4)} (-2%)
            </span>
          </div>
        </div>

        {/* Collapsible Confluence Matrix Breakdown */}
        <div className="border-t border-zinc-800/80 pt-2">
          <button
            type="button"
            onClick={() => setShowMatrixDetails(!showMatrixDetails)}
            className="w-full text-xs text-zinc-400 hover:text-zinc-200 flex items-center justify-between py-1 transition-colors"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              {isArabic ? 'فحص شروط البوابة الكمية (5 Criteria Breakdown)' : '5-Factor Quantitative Gatekeeper'}
            </span>
            <span className="font-mono-num text-[11px] text-emerald-400">
              {setup.criteria.score}/5 {isArabic ? 'مكتملة' : 'Passed'} {showMatrixDetails ? '▲' : '▼'}
            </span>
          </button>

          {showMatrixDetails && (
            <div className="mt-2.5 space-y-1.5 bg-zinc-950/90 p-3 rounded-lg border border-zinc-800 text-xs">
              {/* Criterion 1 */}
              <div className="flex items-center justify-between">
                <span className="text-zinc-300 flex items-center gap-1.5">
                  {setup.criteria.trend ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  )}
                  <span>1. {isArabic ? 'اتجاه EMA 200 & EMA 9/21' : 'EMA 200 & 9/21 Alignment'}</span>
                </span>
                <span className="font-mono-num text-zinc-400 text-[11px]">
                  EMA200: {setup.ema200.toFixed(2)}
                </span>
              </div>

              {/* Criterion 2 */}
              <div className="flex items-center justify-between">
                <span className="text-zinc-300 flex items-center gap-1.5">
                  {setup.criteria.volume ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  )}
                  <span>2. {isArabic ? 'اندفاع الفوليوم المؤسسي (> 1.8x)' : 'Volume Surge (> 1.8x SMA20)'}</span>
                </span>
                <span className="font-mono-num text-amber-300 text-[11px]">
                  {setup.volumeRatio}x
                </span>
              </div>

              {/* Criterion 3 */}
              <div className="flex items-center justify-between">
                <span className="text-zinc-300 flex items-center gap-1.5">
                  {setup.criteria.rsi ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  )}
                  <span>3. {isArabic ? 'زخم RSI(14) في النطاق الذهبي' : 'RSI Momentum Sweet Spot'}</span>
                </span>
                <span className="font-mono-num text-zinc-400 text-[11px]">
                  RSI: {setup.rsi} {isLong ? '(52-68)' : '(32-48)'}
                </span>
              </div>

              {/* Criterion 4 */}
              <div className="flex items-center justify-between">
                <span className="text-zinc-300 flex items-center gap-1.5">
                  {setup.criteria.freshness ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  )}
                  <span>4. {isArabic ? 'حداثة الدخول والحد من الانزلاق (<0.5%)' : 'Slippage Guard (< 0.5% Drift)'}</span>
                </span>
                <span className="font-mono-num text-zinc-400 text-[11px]">
                  +{setup.priceDriftPercent}%
                </span>
              </div>

              {/* Criterion 5 */}
              <div className="flex items-center justify-between">
                <span className="text-zinc-300 flex items-center gap-1.5">
                  {setup.criteria.volatilityRR ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  )}
                  <span>5. {isArabic ? 'تذبذب ATR ونسبة مخاطرة نظيفة (≥1.5)' : 'ATR Expansion & RR ≥ 1.5'}</span>
                </span>
                <span className="font-mono-num text-zinc-400 text-[11px]">
                  ATR: {setup.atr.toFixed(4)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 20x Futures Paper Trading Entry Button */}
        <button
          type="button"
          onClick={() => onEnterPaperTrade && onEnterPaperTrade(setup)}
          className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/30 border border-emerald-400 active:scale-[0.99] cursor-pointer"
        >
          <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
          <span>{isArabic ? '⚡ دخول صفقة فيوتشر (20x) بقيمة 10$' : '⚡ Enter 20x Futures Trade ($10)'}</span>
        </button>

        {/* Action Buttons: Backtest & Export Script & Binance Link */}
        <div className="grid grid-cols-3 gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => onOpenBacktest(setup)}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors border border-zinc-700 hover:border-zinc-600"
            title="اختبار الأداء الكمي المقسم (70% Train / 30% Test)"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            <span>{isArabic ? 'باكتيست' : 'Backtest'}</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenScript(setup)}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors border border-zinc-700 hover:border-zinc-600"
            title="تصدير كود بايثون متكامل vectorbt"
          >
            <Code2 className="w-3.5 h-3.5 text-blue-400" />
            <span>{isArabic ? 'كود بايثون' : 'Python Script'}</span>
          </button>

          <a
            href={binanceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold transition-colors border border-amber-500/30 hover:border-amber-500/50"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            <span>Binance</span>
          </a>
        </div>
      </div>
    </div>
  );
};
