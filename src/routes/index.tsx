import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowRight, Check, ChevronDown, ShieldCheck, TrendingUp, Zap } from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/site-shell";
import { fmtUSD } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "InvestWise — Grow Your Wealth With Smart Investments" },
      {
        name: "description",
        content:
          "Premium investment platform with 5–12% monthly target returns. Open a portfolio in minutes, withdraw anytime.",
      },
      { property: "og:title", content: "InvestWise — Smart Investments" },
      {
        property: "og:description",
        content: "Premium investment platform with transparent returns and 24/7 wealth management.",
      },
    ],
  }),
  component: HomePage,
});

const CHART_DATA = [
  { m: "Jan", v: 10000 }, { m: "Feb", v: 10800 }, { m: "Mar", v: 11650 },
  { m: "Apr", v: 12420 }, { m: "May", v: 13780 }, { m: "Jun", v: 14290 },
  { m: "Jul", v: 15870 }, { m: "Aug", v: 17100 }, { m: "Sep", v: 18650 },
  { m: "Oct", v: 20140 }, { m: "Nov", v: 22000 }, { m: "Dec", v: 24340 },
];

function useCountUp(target: number, duration = 1600) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setV(target * eased);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

function StatTile({ label, target, format, accent }: {
  label: string;
  target: number;
  format: (n: number) => string;
  accent?: boolean;
}) {
  const v = useCountUp(target);
  return (
    <div className="md:col-span-4 bg-surface/40 border border-border p-8 rounded-lg group hover:border-primary/40 transition-colors">
      <p className="text-xs font-bold uppercase tracking-widest text-foreground/40 mb-2">{label}</p>
      <p className={`text-4xl font-display font-bold tabular-nums ${accent ? "text-positive" : ""}`}>
        {format(v)}
      </p>
      <div className={`mt-4 h-1 w-12 transition-all duration-500 group-hover:w-full ${accent ? "bg-positive" : "bg-primary"}`} />
    </div>
  );
}

function HomePage() {
  const { data: plans } = useQuery({
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

  const { data: testimonials } = useQuery({
    queryKey: ["testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-6 py-12 space-y-6">
        {/* HERO BENTO */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 bg-surface/30 border border-border p-10 rounded-lg flex flex-col justify-between min-h-[480px] animate-reveal">
            <div className="max-w-2xl">
              <span className="inline-block text-[10px] font-bold tracking-[0.2em] uppercase text-primary mb-6">
                Wealth Management 2.0
              </span>
              <h1 className="font-display text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight mb-8">
                Grow Your Wealth With <span className="text-primary">Smart</span> Investments.
              </h1>
              <p className="text-lg text-foreground/60 max-w-xl">
                Institutional-grade portfolios, transparent returns, and rebalancing that never sleeps. Start with $1000.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 mt-10">
              <Button asChild size="lg" className="font-bold">
                <Link to="/auth">Start Investing <ArrowRight className="size-4 ml-2" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="font-bold">
                <Link to="/plans">View Plans</Link>
              </Button>
            </div>
          </div>

          {/* Chart tile */}
          <div className="md:col-span-4 bg-surface/50 border border-border p-6 rounded-lg flex flex-col animate-reveal [animation-delay:100ms]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">Portfolio Growth</p>
                <p className="text-2xl font-bold tabular-nums mt-1">$24,340</p>
              </div>
              <span className="text-positive text-sm font-bold tabular-nums">+143.4%</span>
            </div>
            <div className="flex-grow relative overflow-hidden rounded-md border border-border bg-background/40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={CHART_DATA}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="m" hide />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    fill="url(#g1)"
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="w-[2px] h-full bg-primary/20 absolute left-1/2 animate-scan" />
              </div>
            </div>
          </div>

          <StatTile label="Assets Managed" target={40.2} format={(n) => `$${n.toFixed(1)}M+`} />
          <StatTile label="Active Investors" target={5000} format={(n) => `${Math.round(n).toLocaleString()}+`} />
          <StatTile label="Avg Annual Return" target={51.8} format={(n) => `${n.toFixed(1)}%`} accent />
        </section>

        {/* PLANS */}
        <section className="py-16">
          <div className="mb-10 flex justify-between items-end flex-wrap gap-4">
            <div>
              <h2 className="font-display text-4xl font-bold tracking-tight">Precision Tiers</h2>
              <p className="text-foreground/50 mt-2 max-w-md">
                Select the tier aligned with your capital preservation goals.
              </p>
            </div>
            <Button asChild variant="ghost"><Link to="/plans">Compare all <ArrowRight className="size-4 ml-2" /></Link></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans?.map((p) => (
              <div
                key={p.id}
                className={`relative p-8 rounded-lg border flex flex-col transition-transform ${
                  p.popular
                    ? "bg-primary text-primary-foreground border-primary shadow-2xl md:scale-105 z-10"
                    : "bg-surface/20 border-border hover:-translate-y-1"
                }`}
              >
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-positive text-positive-foreground text-[10px] font-black uppercase tracking-tighter px-3 py-1 rounded">
                    Most Popular
                  </div>
                )}
                <h3 className="font-display text-xl font-bold mb-1">{p.name}</h3>
                <p className={`text-sm mb-6 ${p.popular ? "text-primary-foreground/80" : "text-foreground/50"}`}>
                  {p.description}
                </p>
                <div className="space-y-3 mb-8">
                  <div className={`flex justify-between border-b pb-2 ${p.popular ? "border-primary-foreground/20" : "border-border"}`}>
                    <span className="text-sm">Minimum</span>
                    <span className="text-sm font-bold tabular-nums">{fmtUSD(p.min_amount)}</span>
                  </div>
                  <div className={`flex justify-between border-b pb-2 ${p.popular ? "border-primary-foreground/20" : "border-border"}`}>
                    <span className="text-sm">Target Yield</span>
                    <span className={`text-sm font-bold tabular-nums ${p.popular ? "" : "text-positive"}`}>
                      {p.monthly_roi}% monthly
                    </span>
                  </div>
                </div>
                <ul className="space-y-2 mb-8 flex-1">
                  {(p.features as string[]).slice(0, 4).map((f, i) => (
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
        </section>

        {/* HOW IT WORKS */}
        <section className="py-16 -mx-6 px-6 bg-surface/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-border pt-12">
            {[
              { n: "01", t: "Open Your Account", d: "Sign up in minutes with paperless onboarding. Bank-grade encryption from day one.", icon: ShieldCheck },
              { n: "02", t: "Choose a Strategy", d: "Pick a plan matching your risk tolerance — Starter, Growth, or Premium.", icon: TrendingUp },
              { n: "03", t: "Watch It Compound", d: "Automated rebalancing and dividend reinvestment keep your money working 24/7.", icon: Zap },
            ].map((s) => (
              <div key={s.n} className="space-y-4">
                <span className="text-primary font-display text-4xl tabular-nums font-bold">{s.n}.</span>
                <h4 className="text-xl font-bold">{s.t}</h4>
                <p className="text-sm text-foreground/60 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="py-20">
          <h2 className="font-display text-4xl font-bold tracking-tight text-center mb-12">
            Trusted by investors worldwide
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials?.map((t) => (
              <div key={t.id} className="bg-surface/20 border border-border p-8 rounded-lg">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <span key={i} className="text-positive">★</span>
                  ))}
                </div>
                <p className="text-foreground/80 leading-relaxed mb-6">"{t.content}"</p>
                <div>
                  <p className="font-bold">{t.name}</p>
                  <p className="text-sm text-foreground/40">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 max-w-3xl mx-auto">
          <h2 className="font-display text-3xl font-bold mb-10 text-center">Common Inquiries</h2>
          <Accordion type="single" collapsible className="space-y-3">
            {[
              { q: "Is my capital insured?", a: "Yes. Accounts are protected by SIPC up to $500,000 and we use bank-grade 256-bit encryption for all data." },
              { q: "How often can I withdraw funds?", a: "Anytime. Standard withdrawals process within 1–3 business days to your verified bank account." },
              { q: "What are the management fees?", a: "Starter is free. Growth and Premium include a 0.5% AUM fee, billed monthly, with no hidden costs." },
              { q: "What's the minimum investment?", a: "You can open an account with as little as $100 on the Starter plan." },
              { q: "Do you offer a referral program?", a: "Yes — both you and your friend receive a bonus when they fund their first investment." },
            ].map((f, i) => (
              <AccordionItem key={i} value={`q-${i}`} className="border border-border bg-surface/20 rounded-lg px-6">
                <AccordionTrigger className="hover:no-underline font-bold">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-foreground/60">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* CTA */}
        <section className="py-16">
          <div className="bg-primary text-primary-foreground rounded-lg p-12 md:p-16 text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Ready to put your money to work?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Join thousands of investors building wealth with InvestWise. Start with $100, no hidden fees.
            </p>
            <Button asChild size="lg" variant="secondary" className="font-bold">
              <Link to="/auth">Open Your Account <ArrowRight className="size-4 ml-2" /></Link>
            </Button>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
