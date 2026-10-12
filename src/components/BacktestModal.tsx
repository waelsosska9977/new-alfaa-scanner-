import React, { useState } from 'react';
import { ConfirmedSetup, BacktestResult } from '../types/scanner';
import { generatePythonVectorbtScript } from '../utils/backtestEngine';
import { X, Copy, Check, Download, ShieldCheck, Activity, AlertTriangle, Terminal } from 'lucide-react';

interface Props {
  setup: ConfirmedSetup;
  backtestResult: BacktestResult | null;
  isLoading: boolean;
  isArabic: boolean;
  onClose: () => void;
  initialTab?: 'results' | 'python';
}

export const BacktestModal: React.FC<Props> = ({
  setup,
  backtestResult,
  isLoading,
  isArabic,
  onClose,
  initialTab = 'results'
}) => {
  const [activeTab, setActiveTab] = useState<'results' | 'python'>(initialTab);
  const [copied, setCopied] = useState(false);

  const pythonScript = generatePythonVectorbtScript(setup.symbol, setup.timeframe);

  const handleCopy = () => {
    navigator.clipboard.writeText(pythonScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([pythonScript], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `strict_alpha_${setup.symbol.toLowerCase()}_${setup.timeframe}_vectorbt.py`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <Terminal className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-mono-num text-white">
                  {setup.symbol}
                </h2>
                <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-mono-num">
                  {setup.timeframe} · {setup.direction}
                </span>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono-num border border-emerald-500/30">
                  {isArabic ? 'تقسيم كمي 70% تدريب / 30% اختبار' : '70% Train / 30% Test Split'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {isArabic
                  ? 'نموذج المحاكاة الشعاعية (Vectorized Architecture) مع خصم رسوم بينانس 0.06% والانزلاق 0.05%'
                  : 'Vectorized backtest simulation strictly enforcing 0.06% fees and 0.05% slippage'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/30 px-5 pt-2">
          <button
            onClick={() => setActiveTab('results')}
            className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'results'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>{isArabic ? 'نتائج الاختبار المنفصل (In vs Out of Sample)' : 'Backtest Results (Train vs Test)'}</span>
          </button>

          <button
            onClick={() => setActiveTab('python')}
            className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'python'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>{isArabic ? 'كود بايثون الجاهز (vectorbt Script)' : 'Python vectorbt Code'}</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {activeTab === 'results' ? (
            isLoading ? (
              <div className="py-20 text-center space-y-3">
                <div className="inline-block w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <div className="text-sm text-zinc-400">
                  {isArabic ? 'جاري حساب المحاكاة الشعاعية وتقسيم العينات...' : 'Executing vectorized walk-forward simulation...'}
                </div>
              </div>
            ) : backtestResult ? (
              <div className="space-y-5">
                {/* Friction Notice */}
                <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between text-xs text-amber-200">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      {isArabic
                        ? 'تم تطبيق الخصم الواقعي: رسوم صانع/آخذ 0.06% لكل صفقة + انزلاق 0.05% لتجنب تضخيم النتائج.'
                        : 'Real-world execution enforced: 0.06% fees per trade + 0.05% slippage applied to prevent overfitting.'}
                    </span>
                  </div>
                  <span className="font-mono-num font-semibold text-amber-300">
                    FEE: 0.06% · SLIP: 0.05%
                  </span>
                </div>

                {/* Train vs Test Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* In-Sample (Train 70%) */}
                  <div className="bg-zinc-950 border border-blue-500/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                      <div>
                        <h4 className="font-bold text-sm text-blue-400">
                          {isArabic ? '1. العينة التدريبية (In-Sample: 70%)' : 'In-Sample (Train 70%)'}
                        </h4>
                        <span className="text-[11px] text-zinc-500">
                          {backtestResult.trainTestSplit.trainBars} {isArabic ? 'شمعة تاريخية' : 'bars'}
                        </span>
                      </div>
                      <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-mono-num">
                        Train Split
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
                        <div className="text-zinc-400 text-[11px]">{isArabic ? 'إجمالي العائد' : 'Total Return'}</div>
                        <div className={`font-mono-num font-bold text-base ${backtestResult.inSample.totalReturnPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {backtestResult.inSample.totalReturnPercent >= 0 ? '+' : ''}{backtestResult.inSample.totalReturnPercent}%
                        </div>
                      </div>

                      <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
                        <div className="text-zinc-400 text-[11px]">{isArabic ? 'نسبة الفوز' : 'Win Rate'}</div>
                        <div className="font-mono-num font-bold text-base text-white">
                          {backtestResult.inSample.winRate}%
                        </div>
                        <div className="text-[10px] text-zinc-500">{backtestResult.inSample.totalTrades} {isArabic ? 'صفقة' : 'trades'}</div>
                      </div>

                      <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
                        <div className="text-zinc-400 text-[11px]">{isArabic ? 'معامل الربحية' : 'Profit Factor'}</div>
                        <div className="font-mono-num font-bold text-base text-amber-300">
                          {backtestResult.inSample.profitFactor}
                        </div>
                      </div>

                      <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
                        <div className="text-zinc-400 text-[11px]">{isArabic ? 'أقصى تراجع' : 'Max Drawdown'}</div>
                        <div className="font-mono-num font-bold text-base text-rose-400">
                          -{backtestResult.inSample.maxDrawdownPercent}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Out-of-Sample (Test 30%) */}
                  <div className="bg-zinc-950 border border-emerald-500/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                      <div>
                        <h4 className="font-bold text-sm text-emerald-400">
                          {isArabic ? '2. عينة الاختبار الحية (Out-of-Sample: 30%)' : 'Out-of-Sample (Test 30%)'}
                        </h4>
                        <span className="text-[11px] text-zinc-500">
                          {backtestResult.trainTestSplit.testBars} {isArabic ? 'شمعة لم يسبق رؤيتها' : 'unseen bars'}
                        </span>
                      </div>
                      <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono-num">
                        Anti-Overfitting
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
                        <div className="text-zinc-400 text-[11px]">{isArabic ? 'إجمالي العائد الحقيقي' : 'OOS Return'}</div>
                        <div className={`font-mono-num font-bold text-base ${backtestResult.outOfSample.totalReturnPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {backtestResult.outOfSample.totalReturnPercent >= 0 ? '+' : ''}{backtestResult.outOfSample.totalReturnPercent}%
                        </div>
                      </div>

                      <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
                        <div className="text-zinc-400 text-[11px]">{isArabic ? 'نسبة الفوز الحقيقية' : 'OOS Win Rate'}</div>
                        <div className="font-mono-num font-bold text-base text-white">
                          {backtestResult.outOfSample.winRate}%
                        </div>
                        <div className="text-[10px] text-zinc-500">{backtestResult.outOfSample.totalTrades} {isArabic ? 'صفقة' : 'trades'}</div>
                      </div>

                      <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
                        <div className="text-zinc-400 text-[11px]">{isArabic ? 'معامل الربحية الحقيقي' : 'OOS Profit Factor'}</div>
                        <div className="font-mono-num font-bold text-base text-amber-300">
                          {backtestResult.outOfSample.profitFactor}
                        </div>
                      </div>

                      <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
                        <div className="text-zinc-400 text-[11px]">{isArabic ? 'أقصى تراجع حقيقي' : 'OOS Drawdown'}</div>
                        <div className="font-mono-num font-bold text-base text-rose-400">
                          -{backtestResult.outOfSample.maxDrawdownPercent}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Validation Verdict */}
                <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs space-y-1">
                  <div className="font-semibold text-zinc-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>{isArabic ? 'تقييم الحصانة ضد التوليف الزائد (Overfitting Immunity):' : 'Overfitting Validation:'}</span>
                  </div>
                  <p className="text-zinc-400">
                    {backtestResult.outOfSample.profitFactor >= 1.2
                      ? (isArabic
                        ? '✅ الإستراتيجية تحافظ على كفاءة ربحية إيجابية في عينة الاختبار المستقلة (Out-of-Sample)، مما يثبت صلاحية المؤشرات الإحصائية وليست محض صدفة.'
                        : '✅ The strategy maintains robust positive alpha in out-of-sample data, confirming statistical confluence rather than curve fitting.')
                      : (isArabic
                        ? '⚠️ معامل الربحية في عينة الاختبار أقل من المعتاد؛ يرجى الالتزام الصارم بنقاط وقف الخسارة وتجنب مطاردة السعر.'
                        : '⚠️ Lower efficiency on out-of-sample test; strict stop loss discipline required.')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-zinc-500 text-xs">
                {isArabic ? 'لا توجد بيانات كافية لإجراء المحاكاة' : 'Insufficient candle history for backtest'}
              </div>
            )
          ) : (
            /* Python vectorbt Script Tab */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-zinc-400">
                  {isArabic
                    ? 'كود بايثون كامل وجاهز للتشغيل مباشرة بدون أي Placeholder، يستخدم مكتبات vectorbt و pandas و numpy.'
                    : 'Complete, runnable Python script using vectorbt, pandas, and numpy without any placeholders.'}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? (isArabic ? 'تم النسخ!' : 'Copied!') : (isArabic ? 'نسخ الكود' : 'Copy Script')}</span>
                  </button>

                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isArabic ? 'تحميل .py' : 'Download .py'}</span>
                  </button>
                </div>
              </div>

              {/* Code Box */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 overflow-x-auto max-h-[500px]">
                <pre className="font-mono-num text-xs text-zinc-300 leading-relaxed">
                  <code>{pythonScript}</code>
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
          <div className="text-[11px] text-zinc-500">
            {isArabic ? 'هندسة التداول الكمي: خوارزمية Confluence Gatekeeper' : 'Quantitative Trading Engine: Confluence Gatekeeper'}
          </div>
          <button
            onClick={onClose}
            className="py-1.5 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
          >
            {isArabic ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
