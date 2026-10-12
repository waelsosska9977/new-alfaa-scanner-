import React from 'react';
import { MarketType, Timeframe } from '../types/scanner';
import { 
  Zap, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  Filter, 
  Play, 
  Pause, 
  Languages, 
  Code2, 
  SlidersHorizontal,
  Bot
} from 'lucide-react';
import { playSignalAlertSound } from '../utils/audioAlert';

interface Props {
  timeframe: Timeframe;
  setTimeframe: (tf: Timeframe) => void;
  marketType: MarketType;
  setMarketType: (mt: MarketType) => void;
  confirmedOnly: boolean;
  setConfirmedOnly: (val: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  isAutoRefreshActive: boolean;
  setIsAutoRefreshActive: (val: boolean) => void;
  refreshIntervalSeconds: number;
  setRefreshIntervalSeconds: (val: number) => void;
  countdown: number;
  isScanning: boolean;
  onManualScan: () => void;
  isArabic: boolean;
  setIsArabic: (val: boolean) => void;
  onOpenGlobalScript: () => void;
  onOpenTelegram: () => void;
}

export const Header: React.FC<Props> = ({
  timeframe,
  setTimeframe,
  marketType,
  setMarketType,
  confirmedOnly,
  setConfirmedOnly,
  soundEnabled,
  setSoundEnabled,
  isAutoRefreshActive,
  setIsAutoRefreshActive,
  refreshIntervalSeconds,
  setRefreshIntervalSeconds,
  countdown,
  isScanning,
  onManualScan,
  isArabic,
  setIsArabic,
  onOpenGlobalScript,
  onOpenTelegram
}) => {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/90 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Brand & Status */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
              <Zap className="w-5 h-5 text-black font-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base tracking-wide text-white flex items-center gap-1.5">
                  <span>{isArabic ? 'الماسح الكمي الصارم' : 'STRICT ALPHA SCANNER'}</span>
                  <span className="text-[10px] uppercase font-mono-num bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                    PRO QUANT
                  </span>
                </h1>
                {/* Live connection dot */}
                <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full text-[10px] font-mono-num text-zinc-300">
                  <span className={`w-1.5 h-1.5 rounded-full ${isScanning ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
                  <span>{isScanning ? (isArabic ? 'جاري الفحص...' : 'SCANNING') : 'BINANCE LIVE'}</span>
                </div>
              </div>
              <p className="text-[11px] text-zinc-400">
                {isArabic
                  ? 'بوابة ترشيح كمية صارمة (4/5 Confluence) · إشارات حقيقية فقط بدون مضاربات وهمية'
                  : 'Rigid 5-factor confluence gatekeeper across Binance Futures/Spot'}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Market Type (Futures vs Spot) */}
            <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => setMarketType('FUTURES')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  marketType === 'FUTURES'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {isArabic ? 'العقود (Futures)' : 'Futures'}
              </button>
              <button
                type="button"
                onClick={() => setMarketType('SPOT')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  marketType === 'SPOT'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {isArabic ? 'فوري (Spot)' : 'Spot'}
              </button>
            </div>

            {/* Timeframe (15m vs 1h) */}
            <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => setTimeframe('15m')}
                className={`px-2.5 py-1 rounded-md font-semibold font-mono-num transition-colors ${
                  timeframe === '15m'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                15m
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('1h')}
                className={`px-2.5 py-1 rounded-md font-semibold font-mono-num transition-colors ${
                  timeframe === '1h'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                1h
              </button>
            </div>

            {/* Confirmed Only Toggle Switch */}
            <button
              type="button"
              onClick={() => setConfirmedOnly(!confirmedOnly)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                confirmedOnly
                  ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
              title="فلترة الصفقات المؤكدة فقط 4/5 و 5/5"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{isArabic ? 'المؤكدة فقط (4/5+)' : 'Confirmed Only'}</span>
              <span className={`w-2 h-2 rounded-full ${confirmedOnly ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
            </button>

            {/* Auto-Refresh Timer & Trigger */}
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setIsAutoRefreshActive(!isAutoRefreshActive)}
                className="p-1 hover:bg-zinc-800 text-zinc-300 rounded transition-colors"
                title={isAutoRefreshActive ? 'إيقاف مؤقت' : 'استئناف التحديث التلقائي'}
              >
                {isAutoRefreshActive ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
              <div className="font-mono-num px-1.5 text-zinc-300 text-[11px] min-w-[32px] text-center font-medium">
                {isAutoRefreshActive ? `${countdown}s` : 'OFF'}
              </div>
              <button
                type="button"
                onClick={onManualScan}
                disabled={isScanning}
                className="p-1 hover:bg-zinc-800 text-zinc-300 rounded transition-colors disabled:opacity-40"
                title="فحص فوري للأسواق"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
            </div>

            {/* Sound Alert Toggle */}
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  const nextState = !soundEnabled;
                  setSoundEnabled(nextState);
                  if (nextState) playSignalAlertSound('LONG');
                }}
                className={`p-1.5 rounded transition-colors ${
                  soundEnabled ? 'text-emerald-400 hover:bg-emerald-950/40' : 'text-zinc-500 hover:bg-zinc-800'
                }`}
                title={soundEnabled ? 'صوت التنبيه مفعل (انقر للاختبار أو الإيقاف)' : 'تفعيل صوت التنبيه'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Telegram Dispatcher Bot Button */}
            <button
              type="button"
              onClick={onOpenTelegram}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 border border-blue-400"
              title="فتح إعدادات وأكواد بوت تيليجرام"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>{isArabic ? '🤖 بوت تيليجرام' : '🤖 Telegram Bot'}</span>
            </button>

            {/* Python vectorbt Generator Button */}
            <button
              type="button"
              onClick={onOpenGlobalScript}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors"
              title="تصدير كود استراتيجية بايثون vectorbt كاملة"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isArabic ? 'كود vectorbt' : 'Export vectorbt'}</span>
            </button>

            {/* Language Switch */}
            <button
              type="button"
              onClick={() => {
                const nextLang = !isArabic;
                setIsArabic(nextLang);
                if (typeof document !== 'undefined') {
                  document.documentElement.dir = nextLang ? 'rtl' : 'ltr';
                  document.documentElement.lang = nextLang ? 'ar' : 'en';
                }
              }}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 text-xs font-semibold transition-colors"
              title="تغيير اللغة"
            >
              <Languages className="w-3.5 h-3.5" />
              <span className="font-mono-num">{isArabic ? 'EN' : 'عربي'}</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
