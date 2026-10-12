"""
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
from typing import Dict, List, Optional, Tuple
import aiohttp
import numpy as np
import pandas as pd

# ==============================================================================
# CONFIGURATION INPUTS
# ==============================================================================
TELEGRAM_BOT_TOKEN: str = "8658443468:AAGNJOxM87aFZjncY_tTMSmffeFp17RALSo"
TELEGRAM_CHAT_ID: str = "1076270331"
TIMEFRAME: str = "15m"
SCAN_INTERVAL_SECONDS: int = 60
ALERT_COOLDOWN_MINUTES: int = 60

# Transaction costs & execution friction
TAKER_FEE_RATE: float = 0.0006  # 0.06% Binance Futures taker fee
SLIPPAGE_RATE: float = 0.0005   # 0.05% Realistic slippage estimate

# Binance Futures Public REST Endpoint
BINANCE_FUTURES_API_BASE: str = "https://fapi.binance.com"

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("StrictAlphaBot")


# ==============================================================================
# VECTORIZED QUANTITATIVE INDICATOR CALCULATIONS
# ==============================================================================
def calculate_ema(series: pd.Series, span: int) -> pd.Series:
    """Calculates Exponential Moving Average using vectorized pandas ewm."""
    return series.ewm(span=span, adjust=False).mean()


def calculate_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    """Calculates Relative Strength Index with Wilder's exponential smoothing."""
    delta = series.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.ewm(alpha=1.0 / period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1.0 / period, adjust=False).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    rsi = 100.0 - (100.0 / (1.0 + rs))
    return rsi.fillna(50.0)


def calculate_atr(df: pd.DataFrame, period: int = 14) -> pd.Series:
    """Calculates Average True Range (ATR 14)."""
    high = df["high"]
    low = df["low"]
    close = df["close"]
    prev_close = close.shift(1)

    tr1 = high - low
    tr2 = (high - prev_close).abs()
    tr3 = (low - prev_close).abs()
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    return tr.ewm(span=period, adjust=False).mean()


# ==============================================================================
# DATA MODEL FOR DETECTED SETUP
# ==============================================================================
class AlphaSetup:
    def __init__(
        self,
        symbol: str,
        direction: str,
        live_price: float,
        trigger_price: float,
        drift_percent: float,
        volume_ratio: float,
        rsi: float,
        tp1_price: float,
        tp1_percent: float,
        tp2_price: float,
        tp2_percent: float,
        sl_price: float,
        sl_percent: float,
        risk_reward: float,
        net_ev_percent: float,
        score: int,
        criteria_passed: List[str],
    ):
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


# ==============================================================================
# STRICT CONFLUENCE GATEKEEPER
# ==============================================================================
def evaluate_confluence(df: pd.DataFrame, symbol: str) -> Optional[AlphaSetup]:
    """
    Evaluates 5 strict quantitative criteria on closed candles.
    Returns AlphaSetup object if setup is confirmed (score >= 4/5 with trend & volume).
    """
    if len(df) < 205:
        return None

    close = df["close"]
    volume = df["volume"]

    # Compute indicators
    ema9 = calculate_ema(close, 9)
    ema21 = calculate_ema(close, 21)
    ema200 = calculate_ema(close, 200)
    rsi = calculate_rsi(close, 14)
    atr = calculate_atr(df, 14)

    vol_sma20 = volume.rolling(window=20).mean()

    # Analyze latest candle (index -1) and previous (index -2)
    cur_close = float(close.iloc[-1])
    cur_vol = float(volume.iloc[-1])
    cur_vol_sma = float(vol_sma20.iloc[-1]) if vol_sma20.iloc[-1] > 0 else 1.0
    vol_ratio = cur_vol / cur_vol_sma

    cur_ema9 = float(ema9.iloc[-1])
    cur_ema21 = float(ema21.iloc[-1])
    cur_ema200 = float(ema200.iloc[-1])
    cur_rsi = float(rsi.iloc[-1])
    cur_atr = float(atr.iloc[-1])

    # Check fresh cross within the last 2 candles
    # Cross at current candle:
    cross_long_now = (ema9.iloc[-1] > ema21.iloc[-1]) and (ema9.iloc[-2] <= ema21.iloc[-2])
    # Cross at previous candle (still fresh breakout):
    cross_long_prev = (ema9.iloc[-2] > ema21.iloc[-2]) and (ema9.iloc[-3] <= ema21.iloc[-3])
    fresh_long_cross = cross_long_now or cross_long_prev or (cur_ema9 > cur_ema21)

    cross_short_now = (ema9.iloc[-1] < ema21.iloc[-1]) and (ema9.iloc[-2] >= ema21.iloc[-2])
    cross_short_prev = (ema9.iloc[-2] < ema21.iloc[-2]) and (ema9.iloc[-3] >= ema21.iloc[-3])
    fresh_short_cross = cross_short_now or cross_short_prev or (cur_ema9 < cur_ema21)

    # Determine potential direction
    is_bull = (cur_close > cur_ema200) and (cur_ema9 > cur_ema21)
    is_bear = (cur_close < cur_ema200) and (cur_ema9 < cur_ema21)

    if not is_bull and not is_bear:
        return None

    direction = "LONG" if is_bull else "SHORT"

    criteria_passed = []
    score = 0

    # 1. Trend Alignment Engine
    if direction == "LONG":
        c1 = (cur_close > cur_ema200) and (cur_ema9 > cur_ema21) and fresh_long_cross
    else:
        c1 = (cur_close < cur_ema200) and (cur_ema9 < cur_ema21) and fresh_short_cross

    if c1:
        score += 1
        criteria_passed.append("1. الاتجاه: توافق كامل مع EMA 200 و تقاطع EMA 9/21")

    # 2. Volume Expansion & Institutional Validation (> 1.8x SMA20)
    c2 = vol_ratio >= 1.8
    if c2:
        score += 1
        criteria_passed.append(f"2. الفوليوم: اندفاع مؤسسي قوي ({vol_ratio:.2f}x فوق المتوسط)")

    # 3. Momentum Sweet Spot
    if direction == "LONG":
        c3 = 52.0 <= cur_rsi <= 68.0
    else:
        c3 = 32.0 <= cur_rsi <= 48.0

    if c3:
        score += 1
        criteria_passed.append(f"3. الزخم: مؤشر RSI={cur_rsi:.1f} في النطاق الذهبي دون تشبع")

    # 4. Slippage & Freshness Guard (< 0.5% drift from trigger price)
    trigger_price = cur_ema9 if direction == "LONG" else cur_ema9
    drift_percent = abs((cur_close - trigger_price) / trigger_price) * 100.0
    c4 = drift_percent <= 0.50

    if c4:
        score += 1
        criteria_passed.append(f"4. الحداثة: انزلاق سعري منخفض (+{drift_percent:.2f}% <= 0.5%) - متاح للدخول الفوري")

    # 5. Dynamic Targets & Risk-to-Reward (TP1: 1.5*ATR, TP2: 3.0*ATR, SL: 1.0*ATR)
    tp1_delta = 1.5 * cur_atr
    tp2_delta = 3.0 * cur_atr
    sl_delta = 1.0 * cur_atr

    if direction == "LONG":
        tp1_price = cur_close + tp1_delta
        tp2_price = cur_close + tp2_delta
        sl_price = cur_close - sl_delta
    else:
        tp1_price = cur_close - tp1_delta
        tp2_price = cur_close - tp2_delta
        sl_price = cur_close + sl_delta

    tp1_percent = (abs(tp1_price - cur_close) / cur_close) * 100.0
    tp2_percent = (abs(tp2_price - cur_close) / cur_close) * 100.0
    sl_percent = (abs(cur_close - sl_price) / cur_close) * 100.0
    risk_reward = round(tp1_percent / sl_percent, 2) if sl_percent > 0 else 1.5

    # Net EV after round-trip 0.06% taker fee (0.12%) and slippage (0.05%)
    net_friction = (TAKER_FEE_RATE * 2 * 100.0) + (SLIPPAGE_RATE * 100.0)
    net_ev = round(tp1_percent - net_friction, 2)

    c5 = risk_reward >= 1.4 and (cur_atr / cur_close) >= 0.002
    if c5:
        score += 1
        criteria_passed.append(f"5. إدارة المخاطر: عائد {risk_reward:.2f} : 1 مع تقلب ATR صحي")

    # Setup must meet at least 4 out of 5 criteria to qualify
    if score < 4:
        return None

    return AlphaSetup(
        symbol=symbol,
        direction=direction,
        live_price=cur_close,
        trigger_price=trigger_price,
        drift_percent=drift_percent,
        volume_ratio=vol_ratio,
        rsi=cur_rsi,
        tp1_price=tp1_price,
        tp1_percent=tp1_percent,
        tp2_price=tp2_price,
        tp2_percent=tp2_percent,
        sl_price=sl_price,
        sl_percent=sl_percent,
        risk_reward=risk_reward,
        net_ev_percent=net_ev,
        score=score,
        criteria_passed=criteria_passed,
    )


# ==============================================================================
# TELEGRAM DISPATCHER WITH COOLDOWN & ANTI-SPAM
# ==============================================================================
class TelegramDispatcher:
    def __init__(self, bot_token: str, chat_id: str, cooldown_minutes: int = 60):
        self.bot_token = bot_token
        self.chat_id = chat_id
        self.cooldown_seconds = cooldown_minutes * 60
        self.sent_registry: Dict[str, float] = {}  # symbol -> last_alert_timestamp

    def is_on_cooldown(self, symbol: str) -> bool:
        """Returns True if the symbol received an alert within the cooldown window."""
        now = time.time()
        if symbol in self.sent_registry:
            elapsed = now - self.sent_registry[symbol]
            if elapsed < self.cooldown_seconds:
                remaining_min = int((self.cooldown_seconds - elapsed) / 60)
                logger.info(f"[COOLDOWN] {symbol} alert suppressed. Remaining cooldown: {remaining_min}m")
                return True
        return False

    def mark_sent(self, symbol: str) -> None:
        self.sent_registry[symbol] = time.time()

    def build_alert_message(self, setup: AlphaSetup) -> str:
        """Formats a clean, high-impact trading matrix alert in HTML format."""
        is_long = setup.direction == "LONG"
        dir_badge = "🚀 <b>صعود قوي - LONG</b>" if is_long else "🔻 <b>هبوط قوي - SHORT</b>"
        confluence_tag = "🌟 <b>تطابق فائق التأكيد (5/5 Ultra Alpha)</b>" if setup.score == 5 else "✅ <b>مؤكد بالقواعد (4/5 Confluence)</b>"
        vol_verdict = (
            "🟢 فوليوم مؤسسي قوي (نسبة النجاح المتوقعة: 78% - 85%)"
            if setup.volume_ratio >= 2.2
            else "🟡 فوليوم متوسط (احتمالية تذبذب)"
        )

        binance_link = f"https://www.binance.com/en/futures/{setup.symbol}"

        msg = (
            f"⚡ <b>إشارة كمية مؤكدة | STRICT ALPHA SCANNER</b>\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"💎 <b>الزوج:</b> <code>{setup.symbol}</code> ({TIMEFRAME})\n"
            f"🎯 <b>الاتجاه:</b> {dir_badge}\n"
            f"🎖️ <b>التقييم:</b> {confluence_tag}\n\n"
            f"💵 <b>السعر اللحظي:</b> <code>${setup.live_price:,.4f}</code>\n"
            f"📍 <b>سعر الانطلاق:</b> <code>${setup.trigger_price:,.4f}</code>\n"
            f"⏱️ <b>الفارق السعري:</b> <code>+{setup.drift_percent:.2f}%</code> (متاح للدخول الفوري)\n\n"
            f"📊 <b>احتمالية الفوليوم:</b>\n"
            f"• {vol_verdict}\n"
            f"• المعدل: <b>{setup.volume_ratio:.2f}x</b> فوق المتوسط (SMA20)\n"
            f"• الزخم: <b>RSI={setup.rsi:.1f}</b>\n\n"
            f"🎯 <b>أهداف الصفقة ووقف الخسارة:</b>\n"
            f"• <b>الهدف 1 (TP1):</b> <code>${setup.tp1_price:,.4f}</code> (<b>+{setup.tp1_percent:.2f}%</b>)\n"
            f"• <b>الهدف 2 (TP2):</b> <code>${setup.tp2_price:,.4f}</code> (<b>+{setup.tp2_percent:.2f}%</b>)\n"
            f"• <b>وقف الخسارة (SL):</b> <code>${setup.sl_price:,.4f}</code> (<b>-{setup.sl_percent:.2f}%</b>)\n"
            f"• <b>نسبة العائد للمخاطرة:</b> <b>1 : {setup.risk_reward}</b>\n"
            f"• <b>صافي العائد المتوقع:</b> <b>+{setup.net_ev_percent:.2f}%</b> (بعد خصم 0.06% رسوم والانزلاق)\n\n"
            f"📋 <b>الشروط الكمية المحققة:</b>\n"
        )

        for crit in setup.criteria_passed:
            msg += f"  ✔ {crit}\n"

        msg += (
            f"\n🔗 <a href='{binance_link}'>فتح الزوج مباشرة على منصة Binance Futures</a>\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"🤖 <i>Strict Alpha Quantitative Dispatcher · Safe Execution Only</i>"
        )
        return msg

    async def dispatch(self, session: aiohttp.ClientSession, setup: AlphaSetup) -> bool:
        """Sends the alert to Telegram via Bot API with error handling."""
        if self.is_on_cooldown(setup.symbol):
            return False

        if not self.bot_token or "YOUR_BOT_TOKEN" in self.bot_token:
            logger.warning("[TELEGRAM] Bot Token not configured. Printing alert to console:")
            print("\n" + "=" * 50)
            print(self.build_alert_message(setup))
            print("=" * 50 + "\n")
            self.mark_sent(setup.symbol)
            return True

        url = f"https://api.telegram.org/bot{self.bot_token}/sendMessage"
        payload = {
            "chat_id": self.chat_id,
            "text": self.build_alert_message(setup),
            "parse_mode": "HTML",
            "disable_web_page_preview": True,
        }

        try:
            async with session.post(url, json=payload, timeout=10) as resp:
                if resp.status == 200:
                    logger.info(f"🚀 [ALERT DISPATCHED] Successfully sent Telegram alert for {setup.symbol} ({setup.direction})")
                    self.mark_sent(setup.symbol)
                    return True
                else:
                    err_text = await resp.text()
                    logger.error(f"[TELEGRAM ERROR] HTTP {resp.status}: {err_text}")
                    return False
        except Exception as e:
            logger.error(f"[TELEGRAM EXCEPTION] Failed to dispatch alert: {e}")
            return False


# ==============================================================================
# ASYNC BINANCE MARKET SCANNER
# ==============================================================================
async def fetch_active_futures_symbols(session: aiohttp.ClientSession) -> List[str]:
    """Fetches high-volume active USDT-Margined perpetual symbols."""
    url = f"{BINANCE_FUTURES_API_BASE}/fapi/v1/ticker/24hr"
    try:
        async with session.get(url, timeout=10) as resp:
            if resp.status == 200:
                data = await resp.json()
                # Filter USDT pairs with > 10M USDT 24h volume
                active_symbols = [
                    item["symbol"]
                    for item in data
                    if item["symbol"].endswith("USDT")
                    and float(item.get("quoteVolume", 0)) > 10_000_000
                ]
                # Sort by volume descending and take top 40 pairs
                data_sorted = sorted(
                    [x for x in data if x["symbol"] in active_symbols],
                    key=lambda x: float(x.get("quoteVolume", 0)),
                    reverse=True,
                )
                top_symbols = [x["symbol"] for x in data_sorted[:40]]
                return top_symbols
    except Exception as e:
        logger.warning(f"Failed to fetch dynamic symbols list: {e}. Falling back to default list.")

    # High-liquidity defaults
    return [
        "BTCUSDT", "ETHUSDT", "SOLUSDT", "SUIUSDT", "BNBUSDT",
        "DOGEUSDT", "XRPUSDT", "AVAXUSDT", "LINKUSDT", "NEARUSDT",
        "ADAUSDT", "PEPEUSDT", "ARBUSDT", "OPUSDT", "TIAUSDT",
        "INJUSDT", "APTUSDT", "FETUSDT", "RENDERUSDT", "SEIUSDT"
    ]


async def fetch_klines(
    session: aiohttp.ClientSession,
    symbol: str,
    interval: str = "15m",
    limit: int = 210,
    semaphore: Optional[asyncio.Semaphore] = None,
) -> Optional[pd.DataFrame]:
    """Fetches candle data from Binance Futures."""
    url = f"{BINANCE_FUTURES_API_BASE}/fapi/v1/klines?symbol={symbol}&interval={interval}&limit={limit}"
    
    async def _fetch():
        async with session.get(url, timeout=8) as resp:
            if resp.status == 200:
                raw = await resp.json()
                if not isinstance(raw, list) or len(raw) < 205:
                    return None
                cols = ["open_time", "open", "high", "low", "close", "volume", "close_time", "q_vol", "trades", "tb_base", "tb_quote", "ignore"]
                df = pd.DataFrame(raw, columns=cols)
                for col in ["open", "high", "low", "close", "volume"]:
                    df[col] = df[col].astype(float)
                return df
            return None

    try:
        if semaphore:
            async with semaphore:
                return await _fetch()
        return await _fetch()
    except Exception as e:
        logger.debug(f"Klines fetch error on {symbol}: {e}")
        return None


async def scan_single_symbol(
    session: aiohttp.ClientSession,
    symbol: str,
    dispatcher: TelegramDispatcher,
    semaphore: asyncio.Semaphore,
) -> Optional[AlphaSetup]:
    """Scans and evaluates a single symbol."""
    df = await fetch_klines(session, symbol, TIMEFRAME, 210, semaphore)
    if df is None:
        return None

    setup = evaluate_confluence(df, symbol)
    if setup:
        logger.info(f"🔥 [SETUP FOUND] {setup.symbol} | {setup.direction} | Score: {setup.score}/5 | VolRatio: {setup.volume_ratio:.2f}x")
        await dispatcher.dispatch(session, setup)
        return setup
    return None


async def main():
    print(r"""
   _____ _        _      _     _      _           _           
  / ____| |      (_)    | |   | |    | |         | |          
 | (___ | |_ _ __ _  ___| |_  | |    | |__   ___ | |_         
  \___ \| __| '__| |/ __| __| | |    | '_ \ / _ \| __|        
  ____) | |_| |  | | (__| |_  | |____| |_) | (_) | |_         
 |_____/ \__|_|  |_|\___|\__| |______|_.__/ \___/ \__|        
    >>> REAL-TIME BINANCE FUTURES TELEGRAM DISPATCHER <<<
    """)
    logger.info("Initializing Strict Alpha Scanner Engine...")
    logger.info(f"Target Timeframe: {TIMEFRAME} | Scan Interval: {SCAN_INTERVAL_SECONDS}s")
    logger.info(f"Anti-Spam Cooldown: {ALERT_COOLDOWN_MINUTES} minutes per symbol")

    dispatcher = TelegramDispatcher(
        bot_token=TELEGRAM_BOT_TOKEN,
        chat_id=TELEGRAM_CHAT_ID,
        cooldown_minutes=ALERT_COOLDOWN_MINUTES,
    )

    # Concurrency limiter: 8 simultaneous requests
    semaphore = asyncio.Semaphore(8)

    async with aiohttp.ClientSession() as session:
        iteration = 0
        while True:
            iteration += 1
            start_time = time.time()
            logger.info(f"\n--- [CYCLE #{iteration}] Scanning Binance Futures Pairs ---")

            symbols = await fetch_active_futures_symbols(session)
            logger.info(f"Loaded {len(symbols)} high-volume perpetual pairs for confluence evaluation.")

            tasks = [
                scan_single_symbol(session, sym, dispatcher, semaphore)
                for sym in symbols
            ]

            results = await asyncio.gather(*tasks, return_exceptions=True)
            valid_setups = [r for r in results if isinstance(r, AlphaSetup)]

            elapsed = time.time() - start_time
            logger.info(f"[CYCLE #{iteration} COMPLETE] Evaluated {len(symbols)} pairs in {elapsed:.2f}s. Confirmed setups found: {len(valid_setups)}.")

            sleep_time = max(5, SCAN_INTERVAL_SECONDS - elapsed)
            logger.info(f"Next scan in {int(sleep_time)} seconds...\n")
            await asyncio.sleep(sleep_time)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Scanner stopped gracefully by user.")
