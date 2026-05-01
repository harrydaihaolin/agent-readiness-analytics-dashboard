import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RecommendationDiffCard } from "./RecommendationDiffCard";
import type { Recommendation } from "@/types";

const PATCH = `--- a/Makefile
+++ b/Makefile
@@ -1,2 +1,5 @@
 all:
 \tpython build.py
+
+test:
+\tpytest
`;

const baseRec: Recommendation = {
  id: "owner/repo:feedback.test_command",
  repo: "owner/repo",
  pillar: "feedback",
  title: "Add a `test` target to the Makefile",
  rationale: "Agents need a discoverable test command.",
  estimated_lift: 4.2,
  severity: "warn",
  fix_hint: "Add `test:` to your Makefile.",
  affected_checks: ["feedback.test_command"],
  file: "Makefile",
  line: null,
  snippet: "all:\n\tpython build.py\n",
  suggested_patch: PATCH,
  kind: "diff",
};

describe("RecommendationDiffCard", () => {
  it("renders header with title, file, and lift", () => {
    render(<RecommendationDiffCard rec={baseRec} />);
    expect(screen.getByText("Add a `test` target to the Makefile")).toBeInTheDocument();
    expect(screen.getByText("Makefile")).toBeInTheDocument();
    expect(screen.getByLabelText("estimated lift")).toHaveTextContent("+4.2");
  });

  it("renders the unified diff when kind=diff", () => {
    const { container } = render(<RecommendationDiffCard rec={baseRec} />);
    const region = screen.getByRole("region", { name: "suggested patch" });
    expect(region).toBeInTheDocument();
    // At least one added line and one deleted/header line should be tagged.
    const addRows = container.querySelectorAll('[data-diff-kind="add"]');
    expect(addRows.length).toBeGreaterThan(0);
    const headerRows = container.querySelectorAll('[data-diff-kind="header"]');
    expect(headerRows.length).toBe(2); // --- and +++
  });

  it("renders snippet (not diff) when kind=annotation", () => {
    const annot: Recommendation = {
      ...baseRec,
      kind: "annotation",
      suggested_patch: null,
    };
    render(<RecommendationDiffCard rec={annot} />);
    expect(
      screen.queryByRole("region", { name: "suggested patch" }),
    ).not.toBeInTheDocument();
    // snippet should still surface
    expect(screen.getByText(/python build.py/)).toBeInTheDocument();
  });

  it("anchors via id derived from rec.id", () => {
    const { container } = render(<RecommendationDiffCard rec={baseRec} />);
    const card = container.querySelector("article");
    expect(card?.id).toBe("rec-owner_repo_feedback_test_command");
  });

  it("omits suggestion box when fix_hint is null", () => {
    const rec: Recommendation = { ...baseRec, fix_hint: null };
    render(<RecommendationDiffCard rec={rec} />);
    expect(screen.queryByText(/Suggestion · /)).not.toBeInTheDocument();
  });
});
