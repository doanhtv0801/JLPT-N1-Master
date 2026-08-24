import { useSyncExternalStore } from "react";

function emptySubscribe() {
  return () => {};
}

/**
 * True only once the component has mounted on the client. Implemented with
 * `useSyncExternalStore` (server snapshot `false`, client snapshot `true`)
 * rather than the classic `useEffect(() => setMounted(true), [])` pattern,
 * which triggers React's "no setState synchronously in an effect" rule.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}
