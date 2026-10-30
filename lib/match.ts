export type MatchableItem = {
  item_name?: string | null;
  item_type?: string | null;
  color?: string | null;
  location?: string | null;
  description?: string | null;
  status?: string | null;
};

const MATCH_FIELDS: (keyof MatchableItem)[] = [
  "item_name",
  "item_type",
  "color",
  "location",
  "description",
];

function normalize(value: unknown): string {
  return (value ?? "").toString().trim().toLowerCase();
}

export function isPossibleMatch(lost: MatchableItem, found: MatchableItem): boolean {
  if (normalize(lost.status) === "matched" || normalize(lost.status) === "no match") {
    return false;
  }
  if (normalize(found.status) === "matched" || normalize(found.status) === "no match") {
    return false;
  }

  let score = 0;
  for (const field of MATCH_FIELDS) {
    const lostValue = normalize(lost[field]);
    const foundValue = normalize(found[field]);
    if (lostValue !== "" && lostValue === foundValue) {
      score++;
    }
  }
  return score >= 3;
}
