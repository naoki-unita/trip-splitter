"use client";

import { useTrip } from "@/context/TripContext";

export default function ExpenseList() {
  const { expenses, participants, removeExpense } = useTrip();

  const nameOf = (id: string) =>
    participants.find((p) => p.id === id)?.name ?? "(削除された参加者)";

  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h2 className="text-lg font-semibold text-slate-800 mb-2">支払い履歴</h2>
        <p className="text-sm text-slate-400">まだ支払いが記録されていません。</p>
      </div>
    );
  }

  //新しい順にソート
  const sorted = [...expenses].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <h2 className="text-lg font-semibold text-slate-800 mb-3">
        支払い履歴 ({expenses.length}件)
      </h2>
      <ul className="divide-y divide-slate-100">
        {sorted.map((e) => (
          <li key={e.id} className="py-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">
                {e.description}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {nameOf(e.payerId)}が立て替え ・ 対象:{" "}
                {e.participantIds.map(nameOf).join("、")}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-sm font-semibold text-slate-800">
                {e.amount.toLocaleString()} {e.currency}
              </span>
              <button
                onClick={() => removeExpense(e.id)}
                aria-label="削除"
                className="text-slate-400 hover:text-red-500 text-xs"
              >
                削除
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
