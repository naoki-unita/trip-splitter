"use client";

import { useState } from "react";
import { useTrip } from "@/context/TripContext";
import { validateAmount } from "@/lib/calculations";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

export default function ExpenseForm() {
  const { participants, addExpense, baseCurrency } = useTrip();
  const [payerId, setPayerId] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(baseCurrency);
  const [description, setDescription] = useState("");
  const [splitAmong, setSplitAmong] = useState<string[]>([]);
  const [useAllParticipants, setUseAllParticipants] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const targetIds = useAllParticipants
    ? participants.map((p) => p.id)
    : splitAmong;

  function toggleSplitMember(id: string) {
    setSplitAmong((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!payerId) newErrors.payerId = "支払った人を選んでください";
    const amountError = validateAmount(amount);
    if (amountError) newErrors.amount = amountError;
    if (!description.trim()) newErrors.description = "内容を入力してください";
    if (targetIds.length === 0)
      newErrors.split = "割り勘対象者を1人以上選んでください";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    addExpense({
      payerId,
      amount: Number(amount),
      currency,
      description: description.trim(),
      participantIds: targetIds,
    });

    setAmount("");
    setDescription("");
    setErrors({});
    // 支払い者・通貨・対象者はそのまま残す(連続入力しやすくするため)
  }

//参加者がまだ誰も登録されていない時（0人の時）は、ボタンや入力フォームを無効化（操作不能）にする
  const disabled = participants.length === 0; 

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <h2 className="text-lg font-semibold text-slate-800 mb-3">支払いを追加</h2>

      {disabled ? (
        <p className="text-sm text-slate-400">
          先に参加者を追加してください。
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                支払った人
              </label>
              <select
                value={payerId}
                onChange={(e) => setPayerId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">選択してください</option>
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {errors.payerId && (
                <p className="text-xs text-red-600 mt-1">{errors.payerId}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                通貨
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              金額
            </label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="例: 3000"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {errors.amount && (
              <p className="text-xs text-red-600 mt-1">{errors.amount}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              内容
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例: 夕食代"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {errors.description && (
              <p className="text-xs text-red-600 mt-1">{errors.description}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-500">
                割り勘対象者
              </label>
              <label className="flex items-center gap-1 text-xs text-slate-500">
                <input
                  type="checkbox"
                  checked={useAllParticipants}
                  onChange={(e) => setUseAllParticipants(e.target.checked)}
                />
                全員で割り勘
              </label>
            </div>
            {!useAllParticipants && (
              <div className="flex flex-wrap gap-2">
                {participants.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => toggleSplitMember(p.id)}
                    className={`rounded-full px-3 py-1 text-xs border transition-colors ${
                      splitAmong.includes(p.id)
                        ? "bg-brand-600 text-white border-brand-600"
                        : "bg-white text-slate-600 border-slate-300"
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
            {errors.split && (
              <p className="text-xs text-red-600 mt-1">{errors.split}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
          >
            支払いを記録する
          </button>
        </form>
      )}
    </div>
  );
}
