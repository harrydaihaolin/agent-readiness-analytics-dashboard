import { useAnalytics } from "@/api/context";
import { useAsync } from "./useAsync";

export function useRepoRecommendations(repo: string, limit = 50, refreshKey = 0) {
  const { client, tenantId } = useAnalytics();
  return useAsync(
    () => client.repoRecommendations(tenantId, repo, limit),
    [client, tenantId, repo, limit, refreshKey],
  );
}
