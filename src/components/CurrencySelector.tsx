"use client";

import { useTrip } from "@/context/TripContext";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

// 精算を最終的にどの通貨で行うか(基準通貨)を選ぶ。
// 国内旅行だけならJPY固定でよいが、海外旅行対応として選択式にしている。
export default function CurrencySelector() {
  const { baseCurrency, setBaseCurrency, expenses } = useTrip();

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-slate-500">精算通貨</label>
      <select
        value={baseCurrency}
        onChange={(e) => setBaseCurrency(e.target.value)}
        disabled={expenses.length > 0}
        title={
          expenses.length > 0
            ? "支払いを記録した後は精算通貨を変更できません(整合性のため)"
            : undefined
        }
        className="rounded-lg border border-slate-300 px-2 py-1 text-sm disabled:bg-slate-100 disabled:text-slate-400"
      >
        {SUPPORTED_CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}
