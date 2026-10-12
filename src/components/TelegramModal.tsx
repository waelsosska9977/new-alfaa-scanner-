import React, { useState } from 'react';
import { Send, Copy, Check, Download, X, Bot, ShieldCheck, Key, Hash, Bell, Layers, Zap } from 'lucide-react';

interface Props {
  isArabic: boolean;
  onClose: () => void;
}

export const TelegramModal: React.FC<Props> = ({ isArabic, onClose }) => {
  const [activeBotTab, setActiveBotTab] = useState<'interactive' | 'automated'>('interactive');
  const [botToken, setBotToken] = useState('8658443468:AAGNJOxM87aFZjncY_tTMSmffeFp17RALSo');
  const [chatId, setChatId] = useState('1076270331');
  const [copied, setCopied] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);

  const getInteractiveScript = () => {
    return `"""
================================================================================
STRICT ALPHA SCANNER - INTERACTIVE TELEGRAM QUANT BOT (ZERO DEPENDENCIES)
================================================================================
Bot Handle: @newalfaabot
Role: Interactive Quantitative Radar Bot with Inline Keyboard & Liquidation Magnets
Engine: Pure Python Standard Library (No external pip modules required)
================================================================================
"""

import sys
import json
import time
import math
import ssl
import urllib.request
import urllib.parse
import urllib.error

# ================= الإعدادات =================
TELEGRAM_BOT_TOKEN = "${botToken}"

# ================= محرك التحليل السريع (Binance API) =================
def fetch_binance_klines(symbol: str, interval: str = "15m", limit: int = 100):
    symbol = symbol.upper().replace("/", "").replace("USDT", "") + "USDT"
    url = f"https://api.binance.com/api/v3/klines?symbol={symbol}&interval={interval}&limit={limit}"
    
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    req = urllib.request.Request(url, headers={"User-Agent": "StrictAlphaBot/1.0", "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=8, context=ctx) as response:
            if response.status == 200:
                return json.loads(response.read().decode("utf-8")), symbol
            return None, symbol
    except Exception:
        fallback_url = f"https://data-api.binance.vision/api/v3/klines?symbol={symbol}&interval={interval}&limit={limit}"
        req_fallback = urllib.request.Request(fallback_url, headers={"User-Agent": "StrictAlphaBot/1.0"})
        with urllib.request.urlopen(req_fallback, timeout=8, context=ctx) as response:
            return json.loads(response.read().decode("utf-8")), symbol

def analyze_coin_sync(raw_symbol: str) -> str:
    clean_sym = raw_symbol.strip().upper().replace("/", "").replace("USDT", "")
    if not clean_sym:
        return "❌ يرجى كتابة رمز العملة بشكل صحيح (مثال: <code>BTC</code> أو <code>SOL</code>)."

    try:
        klines, symbol = fetch_binance_klines(clean_sym, interval="15m", limit=100)
    except Exception:
        return "⚠️ <b>خطأ في الاتصال:</b> تعذر الوصول لخوادم Binance. يرجى المحاولة لاحقاً."

    if not klines or len(klines) < 25:
        return f"❌ تعذر العثور على الزوج <code>{clean_sym}USDT</code> في Binance. تأكد من صحة الرمز."

    closes = [float(k[4]) for k in klines]
    volumes = [float(k[5]) for k in klines]
    highs = [float(k[2]) for k in klines]
    lows = [float(k[3]) for k in klines]

    current_price = closes[-1]

    def calculate_ema(data, period):
        k = 2.0 / (period + 1.0)
        ema = [data[0]]
        for price in data[1:]:
            ema.append((price * k) + (ema[-1] * (1.0 - k)))
        return ema[-1]

    ema9 = calculate_ema(closes, 9)
    ema21 = calculate_ema(closes, 21)

    vol_sma20 = sum(volumes[-21:-1]) / 20.0 if len(volumes) >= 21 else (sum(volumes) / len(volumes))
    last_closed_vol = volumes[-2] if len(volumes) >= 2 else volumes[-1]
    vol_ratio = round(last_closed_vol / vol_sma20, 2) if vol_sma20 > 0 else 1.0

    tr_list = []
    for i in range(1, len(klines)):
        tr = max(highs[i] - lows[i], abs(highs[i] - closes[i - 1]), abs(lows[i] - closes[i - 1]))
        tr_list.append(tr)
    atr = sum(tr_list[-14:]) / 14.0 if len(tr_list) >= 14 else (current_price * 0.015)

    is_bullish = (current_price > ema9) and (ema9 > ema21)
    direction_badge = "🟢 <b>صعود قوي (LONG) 🚀</b>" if is_bullish else "🔴 <b>هبوط قوي (SHORT) 🔻</b>"

    sl = max(0.000001, current_price - (1.5 * atr) if is_bullish else current_price + (1.5 * atr))
    tp1 = max(0.000001, current_price + (1.5 * atr) if is_bullish else current_price - (1.5 * atr))
    tp2 = max(0.000001, current_price + (3.0 * atr) if is_bullish else current_price - (3.0 * atr))

    sl_pct = abs((sl - current_price) / current_price) * 100.0
    tp1_pct = abs((tp1 - current_price) / current_price) * 100.0
    tp2_pct = abs((tp2 - current_price) / current_price) * 100.0

    short_liq = current_price * 1.02
    long_liq = current_price * 0.98

    if vol_ratio >= 1.8:
        vol_status = f"🟢 <b>انفجار سيولة مؤسسية ({vol_ratio}x)</b> - فرصة قوية"
    elif vol_ratio >= 1.0:
        vol_status = f"🟡 <b>فوليوم طبيعي ومتوسط ({vol_ratio}x)</b>"
    else:
        vol_status = f"🔴 <b>فوليوم ضعيف ({vol_ratio}x)</b> - احذر الكسر الكاذب"

    binance_link = f"https://www.binance.com/en/futures/{symbol}"

    report = (
        f"📊 <b>تقرير التحليل اللحظي لعملة:</b> <code>{symbol}</code>\\n"
        f"━━━━━━━━━━━━━━━━━━━━\\n"
        f"🧭 <b>الاتجاه اللحظي:</b> {direction_badge}\\n"
        f"🎯 <b>السعر الحالي:</b> <code>\${current_price:,.4f}</code>\\n\\n"
        f"📈 <b>خطة الدخول وإدارة المخاطر (15m):</b>\\n"
        f"• <b>وقف الخسارة (SL):</b> <code>\${sl:,.4f}</code> (-{sl_pct:.2f}%)\\n"
        f"• <b>الهدف الأول (TP1):</b> <code>\${tp1:,.4f}</code> (+{tp1_pct:.2f}%)\\n"
        f"• <b>الهدف الثاني (TP2):</b> <code>\${tp2:,.4f}</code> (+{tp2_pct:.2f}%)\\n\\n"
        f"📊 <b>فحص الفوليوم والسيولة:</b>\\n"
        f"• {vol_status}\\n\\n"
        f"🧲 <b>مستويات مغناطيس الليكوديتي (50x):</b>\\n"
        f"• تصفية الشورت (مغناطيس للأعلى): <code>\${short_liq:,.4f}</code> (+2.0%)\\n"
        f"• تصفية اللونغ (مصيدة للأسفل): <code>\${long_liq:,.4f}</code> (-2.0%)\\n"
        f"━━━━━━━━━━━━━━━━━━━━\\n"
        f"🔗 <a href='{binance_link}'>فتح الشارت المباشر على منصة Binance</a>\\n"
        f"⏱ فريم: 15 دقيقة | المؤشرات: EMA 9/21 · ATR 14 · Vol SMA20"
    )
    return report

def get_inline_keyboard():
    return {
        "inline_keyboard": [
            [
                {"text": "🪙 BTC", "callback_data": "BTCUSDT"},
                {"text": "🔷 ETH", "callback_data": "ETHUSDT"},
                {"text": "⚡ SOL", "callback_data": "SOLUSDT"},
            ],
            [
                {"text": "🔥 SUI", "callback_data": "SUIUSDT"},
                {"text": "🚀 HBAR", "callback_data": "HBARUSDT"},
                {"text": "💎 NEAR", "callback_data": "NEARUSDT"},
            ],
            [
                {"text": "🔄 تحديث القائمة", "callback_data": "REFRESH"},
            ]
        ]
    }

def send_telegram_request(method: str, payload: dict):
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/{method}"
    data = json.dumps(payload).encode("utf-8")
    ctx = ssl.create_default_context()
    ctx.check_hostname, ctx.verify_mode = False, ssl.CERT_NONE
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=12, context=ctx) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        return None

def run_standalone_polling_bot():
    send_telegram_request("deleteWebhook", {"drop_pending_updates": False})
    offset = 0
    welcome_text = (
        "👋 <b>أهلاً بك في رادار التحليل الكمي اللحظي!</b>\\n\\n"
        "اختر عملة من الأزرار السريعة بالأسفل للتحليل الفوري، "
        "أو <b>اكتب رمز أي عملة مباشرة</b> في الشات (مثال: <code>DOGE</code> أو <code>APT</code> أو <code>PEPE</code>)."
    )
    while True:
        try:
            updates = send_telegram_request("getUpdates", {"offset": offset, "timeout": 25})
            if not updates or not updates.get("ok"):
                time.sleep(2)
                continue
            for item in updates.get("result", []):
                offset = item["update_id"] + 1
                if "callback_query" in item:
                    cb = item["callback_query"]
                    cb_id, data, chat_id = cb["id"], cb.get("data", ""), cb["message"]["chat"]["id"]
                    send_telegram_request("answerCallbackQuery", {"callback_query_id": cb_id, "text": "جاري التحليل وسحب البيانات..."})
                    if data == "REFRESH":
                        send_telegram_request("sendMessage", {"chat_id": chat_id, "text": "🔄 تم التحديث. اختر عملة للتحليل:", "reply_markup": get_inline_keyboard(), "parse_mode": "HTML"})
                    else:
                        report = analyze_coin_sync(data)
                        send_telegram_request("sendMessage", {"chat_id": chat_id, "text": report, "reply_markup": get_inline_keyboard(), "parse_mode": "HTML", "disable_web_page_preview": True})
                elif "message" in item:
                    msg = item["message"]
                    chat_id, text = msg["chat"]["id"], msg.get("text", "").strip()
                    if text == "/start":
                        send_telegram_request("sendMessage", {"chat_id": chat_id, "text": welcome_text, "reply_markup": get_inline_keyboard(), "parse_mode": "HTML"})
                    elif text.startswith("/"):
                        pass
                    elif text:
                        wait_res = send_telegram_request("sendMessage", {"chat_id": chat_id, "text": f"⏳ جاري فحص <code>{text.upper()}</code> من منصة Binance...", "parse_mode": "HTML"})
                        report = analyze_coin_sync(text)
                        if wait_res and wait_res.get("ok"):
                            send_telegram_request("deleteMessage", {"chat_id": chat_id, "message_id": wait_res["result"]["message_id"]})
                        send_telegram_request("sendMessage", {"chat_id": chat_id, "text": report, "reply_markup": get_inline_keyboard(), "parse_mode": "HTML", "disable_web_page_preview": True})
        except KeyboardInterrupt:
            break
        except Exception:
            time.sleep(3)

if __name__ == "__main__":
    run_standalone_polling_bot()
`;
  };

  const getAutomatedScript = () => {
    return `"""
================================================================================
STRICT ALPHA SCANNER - TELEGRAM DISPATCHER (REAL-TIME ASYNC BOT)
================================================================================
Role: Production-ready Asynchronous Quantitative Trading Systems Bot
Engine: Python 3.10+ | aiohttp | pandas | numpy
Market: Binance USDT-M Futures (Live Public API)
Telegram: Instant Alert Dispatcher with 60-Minute Anti-Spam Cooldown Guard
================================================================================
"""

import asyncio
import logging
import time
from typing import Dict, List, Optional
import aiohttp
import numpy as np
import pandas as pd

# ==============================================================================
# CONFIGURATION INPUTS
# ==============================================================================
TELEGRAM_BOT_TOKEN: str = "${botToken}"
TELEGRAM_CHAT_ID: str = "${chatId}"
TIMEFRAME: str = "15m"
SCAN_INTERVAL_SECONDS: int = 60
ALERT_COOLDOWN_MINUTES: int = 60

# Transaction costs & execution friction
TAKER_FEE_RATE: float = 0.0006  # 0.06% Binance Futures taker fee
SLIPPAGE_RATE: float = 0.0005   # 0.05% Realistic slippage estimate

BINANCE_FUTURES_API_BASE: str = "https://fapi.binance.com"

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("StrictAlphaBot")


def calculate_ema(series: pd.Series, span: int) -> pd.Series:
    return series.ewm(span=span, adjust=False).mean()


def calculate_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    delta = series.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.ewm(alpha=1.0 / period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1.0 / period, adjust=False).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    return (100.0 - (100.0 / (1.0 + rs))).fillna(50.0)


def calculate_atr(df: pd.DataFrame, period: int = 14) -> pd.Series:
    high, low, close = df["high"], df["low"], df["close"]
    prev_close = close.shift(1)
    tr = pd.concat([high - low, (high - prev_close).abs(), (low - prev_close).abs()], axis=1).max(axis=1)
    return tr.ewm(span=period, adjust=False).mean()


class AlphaSetup:
    def __init__(self, symbol, direction, live_price, trigger_price, drift_percent, volume_ratio, rsi, tp1_price, tp1_percent, tp2_price, tp2_percent, sl_price, sl_percent, risk_reward, net_ev_percent, score, criteria_passed):
        self.symbol = symbol
        self.direction = direction
        self.live_price = live_price
        self.trigger_price = trigger_price
        self.drift_percent = drift_percent
        self.volume_ratio = volume_ratio
        self.rsi = rsi
        self.tp1_price = tp1_price
        self.tp1_percent = tp1_percent
        self.tp2_price = tp2_price
        self.tp2_percent = tp2_percent
        self.sl_price = sl_price
        self.sl_percent = sl_percent
        self.risk_reward = risk_reward
        self.net_ev_percent = net_ev_percent
        self.score = score
        self.criteria_passed = criteria_passed


def evaluate_confluence(df: pd.DataFrame, symbol: str) -> Optional[AlphaSetup]:
    if len(df) < 205:
        return None

    close = df["close"]
    volume = df["volume"]

    ema9 = calculate_ema(close, 9)
    ema21 = calculate_ema(close, 21)
    ema200 = calculate_ema(close, 200)
    rsi = calculate_rsi(close, 14)
    atr = calculate_atr(df, 14)
    vol_sma20 = volume.rolling(window=20).mean()

    cur_close = float(close.iloc[-1])
    cur_vol = float(volume.iloc[-1])
    cur_vol_sma = float(vol_sma20.iloc[-1]) if vol_sma20.iloc[-1] > 0 else 1.0
    vol_ratio = cur_vol / cur_vol_sma

    cur_ema9, cur_ema21, cur_ema200 = float(ema9.iloc[-1]), float(ema21.iloc[-1]), float(ema200.iloc[-1])
    cur_rsi, cur_atr = float(rsi.iloc[-1]), float(atr.iloc[-1])

    cross_long = ((ema9.iloc[-1] > ema21.iloc[-1]) and (ema9.iloc[-2] <= ema21.iloc[-2])) or ((ema9.iloc[-2] > ema21.iloc[-2]) and (ema9.iloc[-3] <= ema21.iloc[-3])) or (cur_ema9 > cur_ema21)
    cross_short = ((ema9.iloc[-1] < ema21.iloc[-1]) and (ema9.iloc[-2] >= ema21.iloc[-2])) or ((ema9.iloc[-2] < ema21.iloc[-2]) and (ema9.iloc[-3] >= ema21.iloc[-3])) or (cur_ema9 < cur_ema21)

    is_bull = (cur_close > cur_ema200) and (cur_ema9 > cur_ema21)
    is_bear = (cur_close < cur_ema200) and (cur_ema9 < cur_ema21)
    if not is_bull and not is_bear:
        return None

    direction = "LONG" if is_bull else "SHORT"
    criteria_passed = []
    score = 0

    c1 = (cur_close > cur_ema200 and cross_long) if direction == "LONG" else (cur_close < cur_ema200 and cross_short)
    if c1:
        score += 1
        criteria_passed.append("1. اتجاه متوافق مع EMA 200 و تقاطع EMA 9/21")

    c2 = vol_ratio >= 1.8
    if c2:
        score += 1
        criteria_passed.append(f"2. فوليوم مؤسسي ({vol_ratio:.2f}x فوق المتوسط)")

    c3 = (52.0 <= cur_rsi <= 68.0) if direction == "LONG" else (32.0 <= cur_rsi <= 48.0)
    if c3:
        score += 1
        criteria_passed.append(f"3. زخم RSI={cur_rsi:.1f} في النطاق الذهبي")

    trigger_price = cur_ema9
    drift_percent = abs((cur_close - trigger_price) / trigger_price) * 100.0
    c4 = drift_percent <= 0.50
    if c4:
        score += 1
        criteria_passed.append(f"4. انزلاق منخفض (+{drift_percent:.2f}% <= 0.5%) - دخول فوري")

    tp1_delta, tp2_delta, sl_delta = 1.5 * cur_atr, 3.0 * cur_atr, 1.0 * cur_atr
    tp1_price = cur_close + tp1_delta if direction == "LONG" else cur_close - tp1_delta
    tp2_price = cur_close + tp2_delta if direction == "LONG" else cur_close - tp2_delta
    sl_price = cur_close - sl_delta if direction == "LONG" else cur_close + sl_delta

    tp1_pct = (abs(tp1_price - cur_close) / cur_close) * 100.0
    tp2_pct = (abs(tp2_price - cur_close) / cur_close) * 100.0
    sl_pct = (abs(cur_close - sl_price) / cur_close) * 100.0
    rr = round(tp1_pct / sl_pct, 2) if sl_pct > 0 else 1.5
    net_ev = round(tp1_pct - ((TAKER_FEE_RATE * 2 + SLIPPAGE_RATE) * 100.0), 2)

    c5 = rr >= 1.4 and (cur_atr / cur_close) >= 0.002
    if c5:
        score += 1
        criteria_passed.append(f"5. عائد للمخاطرة 1 : {rr} مع تقلب صحي")

    if score < 4:
        return None

    return AlphaSetup(symbol, direction, cur_close, trigger_price, drift_percent, vol_ratio, cur_rsi, tp1_price, tp1_pct, tp2_price, tp2_pct, sl_price, sl_pct, rr, net_ev, score, criteria_passed)


class TelegramDispatcher:
    def __init__(self, bot_token: str, chat_id: str, cooldown_minutes: int = 60):
        self.bot_token = bot_token
        self.chat_id = chat_id
        self.cooldown_seconds = cooldown_minutes * 60
        self.sent_registry: Dict[str, float] = {}

    def is_on_cooldown(self, symbol: str) -> bool:
        now = time.time()
        if symbol in self.sent_registry:
            if now - self.sent_registry[symbol] < self.cooldown_seconds:
                return True
        return False

    def mark_sent(self, symbol: str) -> None:
        self.sent_registry[symbol] = time.time()

    def build_alert_message(self, s: AlphaSetup) -> str:
        dir_badge = "🚀 <b>صعود قوي - LONG</b>" if s.direction == "LONG" else "🔻 <b>هبوط قوي - SHORT</b>"
        vol_verdict = "🟢 فوليوم مؤسسي قوي" if s.volume_ratio >= 2.2 else "🟡 فوليوم متوسط"
        link = f"https://www.binance.com/en/futures/{s.symbol}"

        msg = (
            f"⚡ <b>إشارة كمية مؤكدة | STRICT ALPHA SCANNER</b>\\n"
            f"━━━━━━━━━━━━━━━━━━━━\\n"
            f"💎 <b>الزوج:</b> <code>{s.symbol}</code> ({TIMEFRAME})\\n"
            f"🎯 <b>الاتجاه:</b> {dir_badge}\\n"
            f"🎖️ <b>التقييم:</b> <b>{s.score}/5 Confluence</b>\\n\\n"
            f"💵 <b>السعر اللحظي:</b> <code>\${s.live_price:,.4f}</code>\\n"
            f"📍 <b>سعر الانطلاق:</b> <code>\${s.trigger_price:,.4f}</code> (<b>+{s.drift_percent:.2f}%</b>)\\n\\n"
            f"📊 <b>الفوليوم:</b> {vol_verdict} (<b>{s.volume_ratio:.2f}x</b>) | <b>RSI={s.rsi:.1f}</b>\\n\\n"
            f"🎯 <b>الأهداف ووقف الخسارة:</b>\\n"
            f"• TP1: <code>\${s.tp1_price:,.4f}</code> (<b>+{s.tp1_percent:.2f}%</b>)\\n"
            f"• TP2: <code>\${s.tp2_price:,.4f}</code> (<b>+{s.tp2_percent:.2f}%</b>)\\n"
            f"• SL:  <code>\${s.sl_price:,.4f}</code> (<b>-{s.sl_percent:.2f}%</b>)\\n"
            f"• عائد:مخاطرة: <b>1 : {s.risk_reward}</b> | صافي الربح: <b>+{s.net_ev_percent:.2f}%</b>\\n\\n"
            f"🔗 <a href='{link}'>فتح الزوج على منصة Binance</a>\\n"
            f"━━━━━━━━━━━━━━━━━━━━"
        )
        return msg

    async def dispatch(self, session: aiohttp.ClientSession, s: AlphaSetup) -> bool:
        if self.is_on_cooldown(s.symbol):
            return False
        if not self.bot_token or "YOUR_BOT" in self.bot_token:
            logger.info(f"[CONSOLE ALERT] {s.symbol} {s.direction}")
            self.mark_sent(s.symbol)
            return True
        url = f"https://api.telegram.org/bot{self.bot_token}/sendMessage"
        payload = {"chat_id": self.chat_id, "text": self.build_alert_message(s), "parse_mode": "HTML", "disable_web_page_preview": True}
        try:
            async with session.post(url, json=payload, timeout=10) as r:
                if r.status == 200:
                    logger.info(f"🚀 Sent Telegram alert for {s.symbol}")
                    self.mark_sent(s.symbol)
                    return True
        except Exception as e:
            logger.error(f"Error dispatching to Telegram: {e}")
        return False


async def main():
    logger.info("Starting Async Binance Futures Telegram Dispatcher...")
    dispatcher = TelegramDispatcher(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, ALERT_COOLDOWN_MINUTES)
    semaphore = asyncio.Semaphore(8)

    async with aiohttp.ClientSession() as session:
        while True:
            symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "SUIUSDT", "BNBUSDT", "DOGEUSDT", "XRPUSDT", "AVAXUSDT", "NEARUSDT", "ADAUSDT", "PEPEUSDT", "TIAUSDT", "FETUSDT"]
            for sym in symbols:
                async with semaphore:
                    try:
                        url = f"{BINANCE_FUTURES_API_BASE}/fapi/v1/klines?symbol={sym}&interval={TIMEFRAME}&limit=210"
                        async with session.get(url, timeout=6) as resp:
                            if resp.status == 200:
                                raw = await resp.json()
                                if isinstance(raw, list) and len(raw) >= 205:
                                    df = pd.DataFrame(raw, columns=["t","o","h","l","c","v","ct","qv","tr","tb","tq","ig"])
                                    for col in ["o","h","l","c","v"]:
                                        df[col] = df[col].astype(float)
                                    df.rename(columns={"o":"open","h":"high","l":"low","c":"close","v":"volume"}, inplace=True)
                                    setup = evaluate_confluence(df, sym)
                                    if setup:
                                        await dispatcher.dispatch(session, setup)
                    except Exception:
                        pass
            await asyncio.sleep(SCAN_INTERVAL_SECONDS)

if __name__ == "__main__":
    asyncio.run(main())
`;
  };

  const currentCode = activeBotTab === 'interactive' ? getInteractiveScript() : getAutomatedScript();
  const currentFileName = activeBotTab === 'interactive' ? 'interactive_telegram_bot.py' : 'telegram_scanner.py';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentCode], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendTest = async () => {
    if (!botToken) {
      setTestStatus(isArabic ? 'يرجى إدخال Telegram Bot Token' : 'Please input bot token');
      return;
    }
    if (!chatId) {
      setTestStatus(isArabic ? 'يرجى إدخال Chat ID' : 'Please input chat ID');
      return;
    }

    setIsSendingTest(true);
    setTestStatus(isArabic ? 'جاري اختبار الاتصال وإرسال التنبيه التجريبي...' : 'Sending test alert...');

    try {
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `⚡ <b>اختبار اتصال ناجح | STRICT ALPHA SCANNER</b>\n━━━━━━━━━━━━━━━━━━━━\n✅ تم ربط البوت الكمي بنجاح بحسابك على تيليجرام!\n🤖 معرّف البوت: @newalfaabot\n━━━━━━━━━━━━━━━━━━━━`,
          parse_mode: 'HTML'
        })
      });

      const data = await res.json();
      if (data.ok) {
        setTestStatus(isArabic ? '✅ تم إرسال الإشعار بنجاح إلى تيليجرام!' : '✅ Dispatched to Telegram successfully!');
      } else {
        setTestStatus(`❌ تيليجرام: ${data.description || 'فشل الإرسال'} (تأكد من فتح @newalfaabot والضغط على Start)`);
      }
    } catch (err: any) {
      setTestStatus(`❌ تعذر الإرسال: ${err?.message || 'خطأ في الشبكة'}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <Bot className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{isArabic ? 'بوت تيليجرام الكمي (Telegram Quant Bots)' : 'Telegram Quant Bots'}</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded font-mono-num">
                  @newalfaabot
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {isArabic
                  ? 'اختر بين البوت التفاعلي بالأزرار (طلب التحليل الفوري) أو الراصد الآلي 24/7'
                  : 'Choose between the Interactive On-Demand Bot or the 24/7 Automated Dispatcher'}
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

        {/* Bot Architecture Tabs Switcher */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/40 px-5 pt-2">
          <button
            onClick={() => setActiveBotTab('interactive')}
            className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeBotTab === 'interactive'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>{isArabic ? '1. البوت التفاعلي بالأزرار (Interactive Bot)' : '1. Interactive Button Bot'}</span>
          </button>

          <button
            onClick={() => setActiveBotTab('automated')}
            className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeBotTab === 'automated'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>{isArabic ? '2. الراصد الآلي المستمر (24/7 Auto Scanner)' : '2. 24/7 Auto Dispatcher'}</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* Bot Activation Notice */}
          <div className="bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-500/40 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="font-bold text-white flex items-center gap-2">
                <span>🤖 {isArabic ? 'معرّف البوت الخاص بك:' : 'Your Bot Handle:'}</span>
                <span className="font-mono-num text-blue-300 bg-blue-900/40 px-2 py-0.5 rounded border border-blue-400/30">@newalfaabot</span>
              </div>
              <p className="text-zinc-300 text-[11px]">
                {isArabic
                  ? '⚠️ خطوة ضرورية: افتح البوت في تيليجرام واضغط على زر Start لتفعيل المحادثة واستقبال التقارير.'
                  : '⚠️ Critical: Open the bot in Telegram and click Start to initiate conversation.'}
              </p>
            </div>
            <a
              href="https://t.me/newalfaabot"
              target="_blank"
              rel="noopener noreferrer"
              className="py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors shrink-0 text-xs flex items-center gap-1 shadow-sm"
            >
              <span>{isArabic ? 'فتح البوت @newalfaabot' : 'Open @newalfaabot'}</span>
              <span>↗</span>
            </a>
          </div>

          {/* Active Bot Description Card */}
          {activeBotTab === 'interactive' ? (
            <div className="bg-blue-950/20 border border-blue-500/30 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="font-bold text-blue-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-blue-400" />
                <span>{isArabic ? 'مميزات البوت التفاعلي بالأزرار (Interactive On-Demand):' : 'Interactive Bot Features:'}</span>
              </div>
              <ul className="text-zinc-300 space-y-1 text-[11px] list-disc list-inside">
                <li>{isArabic ? 'أزرار سريعة للعملات الأكثر طلباً (🪙 BTC, 🔷 ETH, ⚡ SOL, 🔥 SUI, 🚀 HBAR, 💎 NEAR).' : 'Instant Inline Buttons (BTC, ETH, SOL, SUI, HBAR, NEAR).'}</li>
                <li>{isArabic ? 'يمكنك كتابة رمز أي عملة مباشرة في الشات (مثل DOGE أو APT أو TIA) للحصول على التحليل الفوري.' : 'Type any coin ticker in chat (e.g. DOGE, APT) for instant analysis.'}</li>
                <li>{isArabic ? 'حساب مستويات تصفية رافعة 50x (مغناطيس الليكوديتي للأعلى والأسفل).' : 'Computes 50x liquidation magnet levels (Short Liq / Long Liq).'}</li>
                <li>{isArabic ? 'فحص الفوليوم مقارنة بـ SMA20 وأهداف الوقف والربح بناءً على ATR 14.' : 'Evaluates Volume vs SMA20 and ATR targets on 15m.'}</li>
              </ul>
            </div>
          ) : (
            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{isArabic ? 'مميزات الراصد الآلي اللحظي (24/7 Automated Dispatcher):' : 'Automated Dispatcher Features:'}</span>
              </div>
              <ul className="text-zinc-300 space-y-1 text-[11px] list-disc list-inside">
                <li>{isArabic ? 'يعمل في الخلفية 24/7 ويفحص جميع أزواج Binance Futures كل دقيقة.' : 'Runs 24/7 scanning Binance Futures perpetuals every 60s.'}</li>
                <li>{isArabic ? 'حارس مكافحة التكرار (Anti-Spam Cooldown 60 دقيقة) لكل عملة لمنع الإزعاج.' : 'Strict 60-minute in-memory anti-spam cooldown per symbol.'}</li>
                <li>{isArabic ? 'لا يرسل إلا الصفقات المؤكدة كمياً فقط (4/5 Confluence مع توافق EMA 200 واندفاع الفوليوم).' : 'Dispatches ONLY confirmed trade setups (4/5 Confluence).'}</li>
              </ul>
            </div>
          )}

          {/* Configuration Inputs */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3">
            <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-emerald-400" />
              <span>{isArabic ? 'بيانات التوكن الخاصة بك (مدمجة بالفعل):' : 'Pre-Configured Token:'}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1 font-mono-num">
                  TELEGRAM_BOT_TOKEN
                </label>
                <input
                  type="text"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-zinc-200 focus:outline-none focus:border-blue-500 font-mono-num text-[11px]"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-mono-num">
                  TELEGRAM_CHAT_ID
                </label>
                <input
                  type="text"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-zinc-200 focus:outline-none focus:border-blue-500 font-mono-num text-[11px]"
                />
              </div>
            </div>

            {/* Test Send Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={handleSendTest}
                disabled={isSendingTest}
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isArabic ? 'إرسال إشعار تجريبي الآن' : 'Send Test Alert'}</span>
              </button>

              {testStatus && (
                <div className="text-xs text-zinc-300 font-medium">
                  {testStatus}
                </div>
              )}
            </div>
          </div>

          {/* Python Code Display */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-300 font-mono-num">
                {currentFileName}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 py-1 px-2.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? (isArabic ? 'تم النسخ!' : 'Copied!') : (isArabic ? 'نسخ' : 'Copy')}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center gap-1 py-1 px-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isArabic ? 'تحميل الملف' : 'Download .py'}</span>
                </button>
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 overflow-x-auto max-h-[300px]">
              <pre className="font-mono-num text-[11px] text-zinc-300 leading-relaxed">
                <code>{currentCode}</code>
              </pre>
            </div>
          </div>

          {/* Quick Execution Instructions */}
          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 text-xs text-zinc-400 space-y-1.5 font-mono-num">
            <div className="text-zinc-200 font-sans font-semibold">
              {isArabic ? 'أمر التشغيل المباشر في الطرفية (Terminal):' : 'Terminal Execution Command:'}
            </div>
            {activeBotTab === 'interactive' ? (
              <>
                <div className="bg-zinc-900 p-2 rounded text-emerald-400 text-[11px]">
                  # يعمل مباشرة عبر مكتبة بايثون القياسية دون الحاجة لتثبيت أي موديولات خارجية
                </div>
                <div className="bg-zinc-900 p-2 rounded text-emerald-400 text-[11px]">
                  python3 interactive_telegram_bot.py
                </div>
              </>
            ) : (
              <>
                <div className="bg-zinc-900 p-2 rounded text-emerald-400 text-[11px]">
                  pip install aiohttp pandas numpy
                </div>
                <div className="bg-zinc-900 p-2 rounded text-emerald-400 text-[11px]">
                  python3 telegram_scanner.py
                </div>
              </>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
          <div className="text-[11px] text-zinc-500">
            {isArabic ? 'بوتات التحليل والرصد الكمي المباشر' : 'Strict Quantitative Telegram Bots'}
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
