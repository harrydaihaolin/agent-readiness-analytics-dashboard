import { useAnalytics } from "@/api/context";
import { useAsync } from "./useAsync";

export function useTenantOverview(refreshKey: number = 0) {
  const { client, tenantId } = useAnalytics();
  return useAsync(
    () => client.overview(tenantId),
    [client, tenantId, refreshKey],
  );
}
