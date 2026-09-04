import { CurrencyCode, RateTable } from "./types";

// 課題で推奨されている exchangerate.host は現在、無料利用でも
// access_key (要登録) が必須になっている。そこで:
//  1. .env.local に NEXT_PUBLIC_EXCHANGE_API_KEY があれば exchangerate.host を使う
//  2. 無ければ frankfurter.app (ECB公表レート・APIキー不要) にフォールバックする
// という2段構成にして、「APIキーが無くても動くデモ」を担保している。

const EXCHANGE_HOST_BASE = "https://api.exchangerate.host";
const FRANKFURTER_BASE = "https://api.frankfurter.app";

export const SUPPORTED_CURRENCIES: CurrencyCode[] = [
  "JPY",
  "USD",
  "EUR",
  "KRW",
  "CNY",
  "GBP",
  "AUD",
  "THB",
  "TWD",
  "VND",
];

let cache: RateTable | null = null;
const CACHE_TTL_MS = 1000 * 60 * 30; // 30分キャッシュ (同一セッション内でのAPI叩きすぎ防止)

async function fetchFromExchangeHost(base: CurrencyCode): Promise<RateTable | null> {
  const key = process.env.NEXT_PUBLIC_EXCHANGE_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `${EXCHANGE_HOST_BASE}/live?access_key=${key}&source=${base}`
    );
    const json = await res.json();
    if (!json.success) return null;
    const rates: Record<string, number> = {};
    Object.entries(json.quotes as Record<string, number>).forEach(([k, v]) => {
      rates[k.replace(base, "")] = v;
    });
    return { base, rates, fetchedAt: Date.now() };
  } catch {
    return null;
  }
}

async function fetchFromFrankfurter(base: CurrencyCode): Promise<RateTable | null> {
  try {
    const res = await fetch(`${FRANKFURTER_BASE}/latest?from=${base}`);
    if (!res.ok) return null;
    const json = await res.json();
    return { base, rates: json.rates, fetchedAt: Date.now() };
  } catch {
    return null;
  }
}

export async function getRateTable(base: CurrencyCode): Promise<RateTable> {
  if (cache && cache.base === base && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache;
  }

  const fromHost = await fetchFromExchangeHost(base);
  const table = fromHost ?? (await fetchFromFrankfurter(base));

  if (table) {
    cache = table;
    return table;
  }

  // 両方失敗した場合(オフライン等)は、レート1.0のフォールバックを返す。
  // アプリを完全に止めるより、「換算なしで概算表示」させたほうがUXが良いという判断。
  return { base, rates: { [base]: 1 }, fetchedAt: Date.now() };
}

export function convertAmount(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  table: RateTable
): number {
  if (from === to) return amount;
  // table.base -> from のレートと table.base -> to のレートから相互換算する
  const rateFrom = from === table.base ? 1 : table.rates[from];
  const rateTo = to === table.base ? 1 : table.rates[to];
  if (!rateFrom || !rateTo) return amount; // レート不明時は等価とみなす(安全側)
  const inBase = amount / rateFrom;
  return inBase * rateTo;
}
