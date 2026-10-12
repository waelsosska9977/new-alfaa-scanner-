import { RawCandle, MarketType, Timeframe } from '../types/scanner';

export const DEFAULT_WATCHLIST_SYMBOLS = [
  'BTCUSDT',
  'ETHUSDT',
  'SOLUSDT',
  'SUIUSDT',
  'BNBUSDT',
  'DOGEUSDT',
  'XRPUSDT',
  'AVAXUSDT',
  'LINKUSDT',
  'NEARUSDT',
  'ADAUSDT',
  'PEPEUSDT',
  'ARBUSDT',
  'OPUSDT',
  'TIAUSDT',
  'INJUSDT',
  'APTUSDT',
  'FETUSDT',
  'RENDERUSDT',
  'SEIUSDT',
  'SATSUSDT',
  'WLDUSDT',
  'SHIBUSDT'
];

interface Ticker24hResponse {
  symbol: string;
  priceChangePercent: string;
  lastPrice: string;
  volume: string;
  quoteVolume: string;
}

const API_HOSTS = [
  'https://data-api.binance.vision',
  'https://api.binance.com'
];

const FUTURES_API_HOSTS = [
  'https://fapi.binance.com',
  'https://data-api.binance.vision'
];

/**
 * Robust fetch with automatic failover across Binance endpoints
 */
async function resilientFetch<T>(path: string, isFutures: boolean = false): Promise<T> {
  const hosts = isFutures ? FUTURES_API_HOSTS : API_HOSTS;
  let lastError: Error | null = null;

  for (const host of hosts) {
    try {
      const url = `${host}${path}`;
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });
      if (res.ok) {
        return (await res.json()) as T;
      }
    } catch (err: any) {
      lastError = err;
      continue;
    }
  }

  // Fallback try the other host
  try {
    const url = `https://data-api.binance.vision${path.replace('/fapi/v1', '/api/v3')}`;
    const res = await fetch(url);
    if (res.ok) {
      return (await res.json()) as T;
    }
  } catch (err) {
    // pass
  }

  throw lastError || new Error(`Failed to fetch ${path} from all Binance gateways`);
}

/**
 * Fetch 24hr ticker data for universe
 */
export async function fetch24hTickers(marketType: MarketType): Promise<Map<string, { changePercent: number; price: number; volume: number }>> {
  const map = new Map<string, { changePercent: number; price: number; volume: number }>();
  try {
    const path = marketType === 'FUTURES' ? '/fapi/v1/ticker/24hr' : '/api/v3/ticker/24hr';
    const data = await resilientFetch<Ticker24hResponse[]>(path, marketType === 'FUTURES');
    if (Array.isArray(data)) {
      for (const item of data) {
        map.set(item.symbol, {
          changePercent: parseFloat(item.priceChangePercent) || 0,
          price: parseFloat(item.lastPrice) || 0,
          volume: parseFloat(item.quoteVolume) || 0
        });
      }
    }
  } catch (err) {
    console.warn('Ticker24hr fetch fallback to individual lookups', err);
  }
  return map;
}

/**
 * Fetch historical klines for technical indicator computations
 */
export async function fetchKlines(
  symbol: string,
  interval: Timeframe = '15m',
  limit: number = 210,
  marketType: MarketType = 'FUTURES'
): Promise<RawCandle[]> {
  const path = marketType === 'FUTURES'
    ? `/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    : `/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

  const raw = await resilientFetch<any[][]>(path, marketType === 'FUTURES');

  if (!Array.isArray(raw)) {
    throw new Error(`Invalid klines format for ${symbol}`);
  }

  return raw.map((item) => ({
    timestamp: item[0],
    open: parseFloat(item[1]),
    high: parseFloat(item[2]),
    low: parseFloat(item[3]),
    close: parseFloat(item[4]),
    volume: parseFloat(item[5]),
    closeTime: item[6]
  }));
}

/**
 * Scan batch with concurrency limiter
 */
export async function batchScanCandles<T>(
  symbols: string[],
  concurrency: number,
  task: (symbol: string) => Promise<T>
): Promise<T[]> {
  const results: T[] = [];
  const queue = [...symbols];
  const executing: Promise<void>[] = [];

  for (let i = 0; i < Math.min(concurrency, symbols.length); i++) {
    executing.push(worker());
  }

  async function worker() {
    while (queue.length > 0) {
      const sym = queue.shift();
      if (!sym) break;
      try {
        const res = await task(sym);
        if (res !== null && res !== undefined) {
          results.push(res);
        }
      } catch (err) {
        // Individual coin error should not crash whole scanner
      }
    }
  }

  await Promise.all(executing);
  return results;
}
