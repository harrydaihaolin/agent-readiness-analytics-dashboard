import type { ReactNode } from "react";
import type { AsyncState } from "@/hooks/useAsync";

export function StateBoundary<T>({
  state,
  children,
}: {
  state: AsyncState<T>;
  children: (data: T) => ReactNode;
}) {
  if (state.loading) {
    return <p role="status">Loading…</p>;
  }
  if (state.error) {
    return (
      <p role="alert" style={{ color: "#dc2626" }}>
        {state.error.message}
      </p>
    );
  }
  if (state.data === null) {
    return <p>No data.</p>;
  }
  return <>{children(state.data)}</>;
}
