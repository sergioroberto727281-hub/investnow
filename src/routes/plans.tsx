import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { fmtUSD } from "@/lib/format";

export const Route = createFileRoute("/plans")({
  head: () => ({
    meta: [
      { title: "Investment Plans — InvestWise" },
      { name: "description", content: "Compare Starter, Growth, and Premium investment plans. 5–12% monthly target returns starting at $100." },
      { property: "og:title", content: "Investment Plans — InvestWise" },
      { property: "og:description", content: "Three tiers built for every stage of your wealth journey." },
    ],
  }),
  component: PlansPage,
});

function PlansPage() {
  const { data: plans, isLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investment_plans")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="max-w-2xl mb-12">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Plans</span>
          <h1 className="font-display text-5xl font-extrabold tracking-tight mt-4 mb-4">
            Choose your strategy.
          </h1>
          <p className="text-lg text-foreground/60">
            Every plan includes 24/7 algorithmic rebalancing, dividend reinvestment, and one-click withdrawals.
          </p>
        </div>

        {isLoading ? (
          <div className="text-center text-foreground/40 py-20">Loading plans…</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans?.map((p) => (
              <div
                key={p.id}
                className={`relative p-8 rounded-lg border flex flex-col ${
                  p.popular
                    ? "bg-primary text-primary-foreground border-primary shadow-2xl md:scale-105 z-10"
                    : "bg-surface/20 border-border"
                }`}
              >
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-positive text-positive-foreground text-[10px] font-black uppercase tracking-tighter px-3 py-1 rounded">
                    Most Popular
                  </div>
                )}
                <h3 className="font-display text-2xl font-bold mb-2">{p.name}</h3>
                <p className={`text-sm mb-6 ${p.popular ? "text-primary-foreground/80" : "text-foreground/50"}`}>
                  {p.description}
                </p>
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-display font-bold tabular-nums">{p.monthly_roi}%</span>
                    <span className={`text-sm ${p.popular ? "text-primary-foreground/70" : "text-foreground/50"}`}>
                      monthly target
                    </span>
                  </div>
                  <p className={`text-sm mt-1 ${p.popular ? "text-primary-foreground/70" : "text-foreground/50"}`}>
                    Min. {fmtUSD(p.min_amount)} · {p.duration_months}-month term
                  </p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {(p.features as string[]).map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className={`size-4 shrink-0 mt-0.5 ${p.popular ? "" : "text-positive"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button asChild variant={p.popular ? "secondary" : "outline"} className="w-full font-bold">
                  <Link to="/auth">Invest Now</Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </SiteShell>
  );
}
