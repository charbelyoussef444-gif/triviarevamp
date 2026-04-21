export function tallyVotes(votes: Map<string, number>): string | undefined {
  let bestCategory: string | undefined;
  let bestCount = -1;
  for (const [categoryId, count] of votes) {
    if (count > bestCount) {
      bestCount = count;
      bestCategory = categoryId;
    }
  }
  return bestCategory;
}
