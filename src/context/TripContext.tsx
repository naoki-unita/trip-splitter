"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import { Expense, Participant, CurrencyCode } from "@/lib/types";

interface TripState {
  baseCurrency: CurrencyCode;
  participants: Participant[];
  expenses: Expense[];
}

type Action =
  | { type: "ADD_PARTICIPANT"; name: string }
  | { type: "REMOVE_PARTICIPANT"; id: string }
  | { type: "ADD_EXPENSE"; expense: Expense }
  | { type: "REMOVE_EXPENSE"; id: string }
  | { type: "SET_BASE_CURRENCY"; currency: CurrencyCode }
  | { type: "HYDRATE"; state: TripState }
  | { type: "RESET" };

const STORAGE_KEY = "trip-splitter:session";

const initialState: TripState = {
  baseCurrency: "JPY",
  participants: [],
  expenses: [],
};

function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function reducer(state: TripState, action: Action): TripState {
  switch (action.type) {
    case "ADD_PARTICIPANT": {
      const name = action.name.trim();
      if (!name) return state;
      // 同名重複はUX上わかりにくいので防ぐ
      if (state.participants.some((p) => p.name === name)) return state;
      return {
        ...state,
        participants: [...state.participants, { id: genId(), name }],
      };
    }
    case "REMOVE_PARTICIPANT": {
      // その人が関わる支出も一緒に削除する(整合性維持)。
      // ただし「支払い者」として登録済みの支出は、
      // データの矛盾(支払者不明)を避けるため丸ごと削除する仕様にした。
      return {
        ...state,
        participants: state.participants.filter((p) => p.id !== action.id),
        expenses: state.expenses
          .filter((e) => e.payerId !== action.id)
          .map((e) => ({
            ...e,
            participantIds: e.participantIds.filter((pid) => pid !== action.id),
          })),
      };
    }
    case "ADD_EXPENSE":
      return { ...state, expenses: [...state.expenses, action.expense] };
    case "REMOVE_EXPENSE":
      return {
        ...state,
        expenses: state.expenses.filter((e) => e.id !== action.id),
      };
    case "SET_BASE_CURRENCY":
      return { ...state, baseCurrency: action.currency };
    case "HYDRATE":
      return action.state;
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

interface TripContextValue extends TripState {
  addParticipant: (name: string) => void;
  removeParticipant: (id: string) => void;
  addExpense: (expense: Omit<Expense, "id" | "createdAt">) => void;
  removeExpense: (id: string) => void;
  setBaseCurrency: (currency: CurrencyCode) => void;
  reset: () => void;
}

const TripContext = createContext<TripContextValue | null>(null);

export function TripProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // セッション内保持: DBは持たないが、リロードで消えると使い勝手が悪いので
  // sessionStorage(タブを閉じたら消える = 要件の「セッション内」に合致)に保存する。
  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        dispatch({ type: "HYDRATE", state: JSON.parse(saved) });
      } catch {
        // 壊れたデータは無視
      }
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addParticipant = useCallback(
    (name: string) => dispatch({ type: "ADD_PARTICIPANT", name }),
    []
  );
  const removeParticipant = useCallback(
    (id: string) => dispatch({ type: "REMOVE_PARTICIPANT", id }),
    []
  );
  const addExpense = useCallback(
    (expense: Omit<Expense, "id" | "createdAt">) =>
      dispatch({
        type: "ADD_EXPENSE",
        expense: { ...expense, id: genId(), createdAt: Date.now() },
      }),
    []
  );
  const removeExpense = useCallback(
    (id: string) => dispatch({ type: "REMOVE_EXPENSE", id }),
    []
  );
  const setBaseCurrency = useCallback(
    (currency: CurrencyCode) => dispatch({ type: "SET_BASE_CURRENCY", currency }),
    []
  );
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  const value = useMemo<TripContextValue>(
    () => ({
      ...state,
      addParticipant,
      removeParticipant,
      addExpense,
      removeExpense,
      setBaseCurrency,
      reset,
    }),
    [state, addParticipant, removeParticipant, addExpense, removeExpense, setBaseCurrency, reset]
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip(): TripContextValue {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error("useTrip must be used within TripProvider");
  return ctx;
}
