import { RecommendationCard } from "@/components/RecommendationCard";
import { StateBoundary } from "@/components/StateBoundary";
import { useRecommendations } from "@/hooks/useRecommendations";
import { color } from "@/design/tokens";

export function RecommendationsPage() {
  const state = useRecommendations(15);
  return (
    <>
      <h1 style={{ marginBottom: 4 }}>Actionable items</h1>
      <p style={{ color: color.textMuted, margin: "0 0 20px", fontSize: 14 }}>
        Ranked by estimated lift on the tenant's overall score. Targets the
        weakest pillar first. Click any card to open the repo with the
        suggested patch already in view.
      </p>
      <StateBoundary state={state}>
        {(data) =>
          data.items.length === 0 ? (
            <p style={{ color: color.textMuted }}>
              Nothing to do — all repos look healthy.
            </p>
          ) : (
            <div>
              {data.items.map((rec) => (
                <RecommendationCard key={rec.id} rec={rec} />
              ))}
            </div>
          )
        }
      </StateBoundary>
    </>
  );
}
