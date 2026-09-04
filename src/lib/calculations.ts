import { Expense, Participant, Settlement, CurrencyCode } from "./types";

/**
 * 「小数点以下の処理」について:
 * 精算金額は最終的に基準通貨(baseCurrency)の整数値に丸める。
 * ただし単純に各人ごとに Math.round すると、四捨五入誤差の蓄積で
 * 「全員の負担合計 ≠ 支出合計」になってしまうことがある。
 * これを防ぐため、割り勘計算は「余りを最初のN人に1ずつ配る」方式で
 * 端数が絶対に消えない(誤差ゼロ)ようにしている。
 */

// 1件の支出を、対象者に整数円(または整数単位)で割り振る。
// 例: 1000円を3人で割ると 334, 333, 333 (合計が必ず1000に一致する)
export function splitAmount(amount: number, participantCount: number): number[] {
  if (participantCount <= 0) return [];
  const base = Math.floor(amount / participantCount);
  const remainder = Math.round(amount) - base * participantCount;
  // 端数(remainder)は先頭から1ずつ配る。誰が多く払うかは
  // 「支出を登録した順に決定的に決まる」ようにして、結果を再現可能にする。
  return Array.from({ length: participantCount }, (_, i) =>
    i < remainder ? base + 1 : base
  );
}

/**
 * 全支出から「各参加者の純負担額(payerId基準・基準通貨換算後)」を計算する。
 * balances[personId] = 支払った額 - 負担すべき額
 *   > 0 : 他の人からお金を受け取るべき人 (立て替えが多い)
 *   < 0 : 他の人にお金を払うべき人 (負担より支払いが少ない)
 */
export function calculateBalances(
  participants: Participant[],
  expenses: Expense[],
  convertToBase: (amount: number, currency: CurrencyCode) => number
): Record<string, number> {
  const balances: Record<string, number> = {};
  participants.forEach((p) => (balances[p.id] = 0));

  for (const expense of expenses) {
    const targetIds =
      expense.participantIds.length > 0
        ? expense.participantIds
        : participants.map((p) => p.id);

    const baseAmount = Math.round(convertToBase(expense.amount, expense.currency));
    const shares = splitAmount(baseAmount, targetIds.length);

    // 支払った人は全額プラス
    if (balances[expense.payerId] !== undefined) {
      balances[expense.payerId] = (balances[expense.payerId] ?? 0) + baseAmount;
    }
    // 対象者はそれぞれの取り分だけマイナス
    targetIds.forEach((id, i) => {
      const share = shares[i];
      if (balances[id] !== undefined && share !== undefined) {
        balances[id] -= share;
      }
    });
  }

  return balances;
}

/**
 * 貸し借りの「送金回数」を最小化するアルゴリズム(貪欲法)。
 * 単純に「全員がお互いに払う」形式だと N人でN(N-1)/2件の送金が発生しうるが、
 * 「一番の債権者」と「一番の債務者」を毎回マッチさせていくことで
 * 送金は最大 (人数-1) 件に収まる。
 */
export function calculateSettlements(
  balances: Record<string, number>
): Settlement[] {
  // 1円未満(丸め誤差)は無視する
  const creditors = Object.entries(balances)
    .filter(([, v]) => v > 0)
    .map(([id, amount]) => ({ id, amount }))
    .sort((a, b) => b.amount - a.amount);

  const debtors = Object.entries(balances)
    .filter(([, v]) => v < 0)
    .map(([id, amount]) => ({ id, amount: -amount }))
    .sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    if (!debtor || !creditor) break;
    const amount = Math.min(debtor.amount, creditor.amount);

    if (amount > 0) {
      settlements.push({ fromId: debtor.id, toId: creditor.id, amount });
    }

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount === 0) i++;
    if (creditor.amount === 0) j++;
  }

  return settlements;
}

export function validateAmount(value: string): string | null {
  if (value.trim() === "") return "金額を入力してください";
  const num = Number(value);
  if (Number.isNaN(num)) return "数値を入力してください";
  if (num <= 0) return "金額は0より大きい値を入力してください";
  if (!Number.isFinite(num)) return "有効な数値を入力してください";
  return null;
}
