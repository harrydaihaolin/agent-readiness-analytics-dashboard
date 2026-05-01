import { useAnalytics } from "@/api/context";
import { useAsync } from "./useAsync";

export function useRecommendations(limit = 10) {
  const { client, tenantId } = useAnalytics();
  return useAsync(
    () => client.recommendations(tenantId, limit),
    [client, tenantId, limit],
  );
}
