"use client";

import { useEffect, useMemo, useState } from "react";
import { useTrip } from "@/context/TripContext";
import { calculateBalances, calculateSettlements } from "@/lib/calculations";
import { convertAmount, getRateTable } from "@/lib/currency";
import { RateTable } from "@/lib/types";

export default function SettlementResult() {
  const { participants, expenses, baseCurrency } = useTrip();
  const [rateTable, setRateTable] = useState<RateTable | null>(null);
  const [loading, setLoading] = useState(false);
  const [rateError, setRateError] = useState(false);

  const currenciesUsed = useMemo(
    () => Array.from(new Set(expenses.map((e) => e.currency))),
    [expenses]
  );
  const needsConversion = currenciesUsed.some((c) => c !== baseCurrency);

  useEffect(() => {
    if (!needsConversion) {
      setRateTable(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setRateError(false);
    getRateTable(baseCurrency)
      .then((table) => {
        if (!cancelled) setRateTable(table);
      })
      .catch(() => {
        if (!cancelled) setRateError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [baseCurrency, needsConversion, expenses.length]);

  const convertToBase = (amount: number, currency: string) => {
    if (currency === baseCurrency) return amount;
    if (!rateTable) return amount; // レート未取得時は等価換算(概算表示の注記あり)
    return convertAmount(amount, currency, baseCurrency, rateTable);
  };

  const balances = useMemo(
    () => calculateBalances(participants, expenses, convertToBase),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [participants, expenses, rateTable, baseCurrency]
  );
  const settlements = useMemo(() => calculateSettlements(balances), [balances]);

  const nameOf = (id: string) =>
    participants.find((p) => p.id === id)?.name ?? "(削除された参加者)";

  if (participants.length === 0 || expenses.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h2 className="text-lg font-semibold text-slate-800 mb-2">精算結果</h2>
        <p className="text-sm text-slate-400">
          参加者と支払いを追加すると、ここに精算結果が表示されます。
        </p>
      </div>
    );
  }

  const totalInBase = expenses.reduce(
    (sum, e) => sum + Math.round(convertToBase(e.amount, e.currency)),
    0
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-slate-800">精算結果</h2>
        {needsConversion && loading && (
          <span className="text-xs text-slate-400">為替レート取得中...</span>
        )}
        {needsConversion && rateError && (
          <span className="text-xs text-amber-600">
            為替レート取得に失敗しました(等倍で概算表示中)
          </span>
        )}
      </div>

      <p className="text-sm text-slate-600 mb-4">
        合計支出:{" "}
        <span className="font-semibold text-slate-800">
          {totalInBase.toLocaleString()} {baseCurrency}
        </span>
        {needsConversion && (
          <span className="text-xs text-slate-400 ml-1">(換算後)</span>
        )}
      </p>

      {settlements.length === 0 ? (
        <p className="text-sm text-emerald-600 font-medium">
          全員の負担額が釣り合っています。精算の必要はありません 🎉
        </p>
      ) : (
        <ul className="space-y-2">
          {settlements.map((s, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3"
            >
              <span className="text-sm text-slate-700">
                <span className="font-medium text-slate-900">{nameOf(s.fromId)}</span>
                {" → "}
                <span className="font-medium text-slate-900">{nameOf(s.toId)}</span>
              </span>
              <span className="text-sm font-semibold text-brand-700">
                {s.amount.toLocaleString()} {baseCurrency}
              </span>
            </li>
          ))}
        </ul>
      )}

      <details className="mt-4">
        <summary className="text-xs text-slate-400 cursor-pointer">
          各参加者の内訳を見る
        </summary>
        <ul className="mt-2 space-y-1">
          {participants.map((p) => {
            const b = balances[p.id] ?? 0;
            return (
              <li key={p.id} className="flex justify-between text-xs text-slate-500">
                <span>{p.name}</span>
                <span className={b >= 0 ? "text-emerald-600" : "text-red-500"}>
                  {b >= 0 ? "+" : ""}
                  {b.toLocaleString()} {baseCurrency}
                </span>
              </li>
            );
          })}
        </ul>
      </details>
    </div>
  );
}
