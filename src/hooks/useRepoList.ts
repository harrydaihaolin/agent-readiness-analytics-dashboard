import { useAnalytics } from "@/api/context";
import { useAsync } from "./useAsync";

export function useRepoList(
  page: number,
  size: number,
  q: string,
  refreshKey: number = 0,
) {
  const { client, tenantId } = useAnalytics();
  return useAsync(
    () => client.listRepos(tenantId, { page, size, q: q || undefined }),
    [client, tenantId, page, size, q, refreshKey],
  );
}
