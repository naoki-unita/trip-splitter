"use client";

import ParticipantManager from "@/components/ParticipantManager";
import ExpenseForm from "@/components/ExpenseForm";
import ExpenseList from "@/components/ExpenseList";
import SettlementResult from "@/components/SettlementResult";
import CurrencySelector from "@/components/CurrencySelector";
import { useTrip } from "@/context/TripContext";

export default function Home() {
  const { reset, participants, expenses } = useTrip();

  function handleReset() {
    if (participants.length === 0 && expenses.length === 0) return;
    if (confirm("すべてのデータを消去して最初からやり直しますか?")) {
      reset();
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">旅費割り勘</h1>
          <p className="text-sm text-slate-500 mt-1">
            友人との旅行費用を記録して、誰が誰にいくら払うかを自動計算します
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CurrencySelector />
          <button
            onClick={handleReset}
            className="text-xs text-slate-400 hover:text-red-500 underline"
          >
            リセット
          </button>
        </div>
      </header>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="space-y-5">
          <ParticipantManager />
          <ExpenseForm />
        </div>
        <div className="space-y-5">
          <SettlementResult />
          <ExpenseList />
        </div>
      </div>

      <footer className="mt-10 text-center text-xs text-slate-400">
        データはこのブラウザタブを開いている間だけ保持されます(DBなし・セッション限定)
      </footer>
    </main>
  );
}
