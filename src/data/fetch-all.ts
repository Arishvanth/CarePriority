/** Rows requested per round trip. PostgREST caps a single response anyway. */
const PAGE_SIZE = 1000;

interface RangeQuery<T> {
  range(from: number, to: number): PromiseLike<{ data: T[] | null; error: { message: string } | null }>;
}

/**
 * Reads an entire ordered table selection in fixed-size batches instead of a
 * single capped request, so screens never silently miss older records as the
 * clinic grows. The caller supplies the ordering, which is kept across pages.
 */
export async function fetchAllRows<T>(build: () => RangeQuery<T>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await build().range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return rows;
}
