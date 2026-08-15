function isNumericOnlyTitle(text) {
  const t = String(text || "").trim();
  if (!t) return true;
  if (/^(s\.?\s*no|action|unit|qty\.?|quantity|budget)$/i.test(t)) return true;
  return /^[\d.,\s]+$/.test(t);
}

export function isMalformedNtfpActionItems(items = []) {
  const leaves = items.filter((i) => i.parentActionCode);
  if (leaves.length < 3) return false;
  const numeric = leaves.filter((i) => isNumericOnlyTitle(i.actionTitle));
  if (numeric.length >= Math.max(3, leaves.length * 0.4)) return true;
  const budget = leaves.reduce((s, i) => s + Number(i.plannedBudgetPKR || 0), 0);
  return budget > 0 && budget < 10000 && leaves.length > 10;
}

export { isNumericOnlyTitle };
