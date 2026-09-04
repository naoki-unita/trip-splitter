"use client";

import { useState } from "react";
import { useTrip } from "@/context/TripContext";

export default function ParticipantManager() {
  const { participants, addParticipant, removeParticipant, expenses } = useTrip();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("名前を入力してください");
      return;
    }
    if (participants.some((p) => p.name === trimmed)) {
      setError("同じ名前の参加者が既にいます");
      return;
    }
    addParticipant(trimmed);
    setName("");
    setError(null);
  }

  function handleRemove(id: string) {
    const involved = expenses.some(
      (e) => e.payerId === id || e.participantIds.includes(id)
    );
    if (
      involved &&
      !confirm(
        "この人が関わる支払い記録があります。削除すると関連する支払いも削除(または対象者から除外)されます。よろしいですか?"
      )
    ) {
      return;
    }
    removeParticipant(id);
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <h2 className="text-lg font-semibold text-slate-800 mb-3">参加者</h2>

      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="名前を入力 (例: たなか)"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          onClick={handleAdd}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
        >
          追加
        </button>
      </div>
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

      {participants.length === 0 ? (
        <p className="text-sm text-slate-400 mt-3">
          まだ参加者がいません。旅行メンバーを追加してください。
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2 mt-3">
          {participants.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-2 rounded-full bg-brand-50 text-brand-700 pl-3 pr-1 py-1 text-sm"
            >
              {p.name}
              <button
                onClick={() => handleRemove(p.id)}
                aria-label={`${p.name}を削除`}
                className="rounded-full w-5 h-5 flex items-center justify-center text-brand-500 hover:bg-brand-100"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
