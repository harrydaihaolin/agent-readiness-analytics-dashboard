import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { RecommendationCard } from "./RecommendationCard";
import type { Recommendation } from "@/types";

const rec: Recommendation = {
  id: "owner/repo:check",
  repo: "owner/repo",
  pillar: "cognitive_load",
  title: "Split large files",
  rationale: "5 files exceed the 500-line budget.",
  estimated_lift: 4.2,
  severity: "warn",
  fix_hint: "Extract modules.",
  affected_checks: ["repo_shape.large_files"],
  file: "src/big.py",
  line: null,
  snippet: null,
  suggested_patch: null,
  kind: "annotation",
};

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("RecommendationCard", () => {
  it("renders title, rationale, repo, and lift", () => {
    renderWithRouter(<RecommendationCard rec={rec} />);
    expect(screen.getByText("Split large files")).toBeInTheDocument();
    expect(screen.getByText(/5 files exceed/)).toBeInTheDocument();
    expect(screen.getByLabelText("estimated lift")).toHaveTextContent("+4.2");
    expect(screen.getByText("owner/repo")).toBeInTheDocument();
  });

  it("links to the repo page anchored on the recommendation id", () => {
    renderWithRouter(<RecommendationCard rec={rec} />);
    const link = screen.getByRole("link", {
      name: /Open Split large files in owner\/repo/,
    });
    // encodeURIComponent("owner/repo") -> "owner%2Frepo"
    expect(link).toHaveAttribute(
      "href",
      "/repos/owner%2Frepo#rec-owner_repo_check",
    );
  });

  it("shows a diff badge only when the recommendation carries a patch", () => {
    const { rerender } = renderWithRouter(<RecommendationCard rec={rec} />);
    expect(screen.queryByText("diff")).not.toBeInTheDocument();
    rerender(
      <MemoryRouter>
        <RecommendationCard
          rec={{
            ...rec,
            kind: "diff",
            suggested_patch: "--- a/x\n+++ b/x\n@@\n+y\n",
          }}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("diff")).toBeInTheDocument();
  });

  it("renders file:line when file is present", () => {
    renderWithRouter(
      <RecommendationCard
        rec={{ ...rec, file: "src/big.py", line: 42 }}
      />,
    );
    expect(screen.getByText("src/big.py:42")).toBeInTheDocument();
  });
});
