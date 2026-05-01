import { useAnalytics } from "@/api/context";
import { useAsync } from "./useAsync";

export function useTrend(repo: string, windowDays = 30, refreshKey: number = 0) {
  const { client, tenantId } = useAnalytics();
  return useAsync(
    () => client.trend(tenantId, repo, windowDays),
    [client, tenantId, repo, windowDays, refreshKey],
  );
}
