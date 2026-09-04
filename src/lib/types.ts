// ドメインの型定義。DBを使わないのでこれがそのままアプリの「スキーマ」になる。

export type CurrencyCode = string; // "JPY" "USD" "EUR" など ISO4217

export interface Participant {
  id: string;
  name: string;
}

export interface Expense {
  id: string;
  payerId: string; // 立て替えた人
  amount: number; // 入力通貨での金額 (正の数のみ)
  currency: CurrencyCode; // 支払いに使った通貨
  description: string; // 何に払ったか
  participantIds: string[]; // この支払いを割り勘する対象者 (デフォルト:全員)
  createdAt: number;
}

// 精算(送金)指示 1件
export interface Settlement {
  fromId: string; // 支払う人
  toId: string; // 受け取る人
  amount: number; // 基準通貨(baseCurrency)での金額
}

// 為替レート取得結果のキャッシュ形式
export interface RateTable {
  base: CurrencyCode;
  rates: Record<CurrencyCode, number>; // 1 base = rates[X] X
  fetchedAt: number;
}
