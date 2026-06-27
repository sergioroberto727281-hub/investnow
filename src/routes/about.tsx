import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Eye, Award, Users } from "lucide-react";
import { SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — InvestWise" },
      { name: "description", content: "Our story, mission, and the team building InvestWise — the next generation of wealth management." },
      { property: "og:title", content: "About InvestWise" },
      { property: "og:description", content: "Our story, mission, and the team behind InvestWise." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-6 py-16 space-y-20">
        <section className="max-w-3xl">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Our Story</span>
          <h1 className="font-display text-5xl md:text-6xl font-extrabold tracking-tight mt-4 mb-6">
            Wealth, rebuilt for the modern investor.
          </h1>
          <p className="text-lg text-foreground/70 leading-relaxed">
            InvestWise was founded in 2019 by a team of former hedge fund quants and fintech engineers
            who believed institutional-grade wealth management shouldn't be reserved for the ultra-wealthy.
            Today we manage over $40.2 million across 5,000+ portfolios in 32 countries.
          </p>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <div className="bg-surface/30 border border-border rounded-lg p-10">
            <h2 className="font-display text-2xl font-bold mb-4">Our Mission</h2>
            <p className="text-foreground/70 leading-relaxed">
              Democratize access to algorithmic, institutional-grade investment strategies. Every investor —
              regardless of starting capital — deserves the same precision tooling Wall Street uses.
            </p>
          </div>
          <div className="bg-surface/30 border border-border rounded-lg p-10">
            <h2 className="font-display text-2xl font-bold mb-4">Our Vision</h2>
            <p className="text-foreground/70 leading-relaxed">
              A world where building wealth is transparent, automated, and accessible. No black boxes,
              no minimums that exclude, no fees that erode returns.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-display text-3xl font-bold mb-10">Why InvestWise</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { i: ShieldCheck, t: "Bank-grade security", d: "256-bit encryption, SIPC insured up to $500K." },
              { i: Eye, t: "Radical transparency", d: "Every fee, every allocation, surfaced in real time." },
              { i: Award, t: "Proven returns", d: "51.8% average annual return across all portfolios." },
              { i: Users, t: "5K+ investors", d: "A community of investors trusting us with their wealth." },
            ].map((f) => (
              <div key={f.t} className="bg-surface/20 border border-border rounded-lg p-6">
                <f.i className="size-6 text-primary mb-4" />
                <h3 className="font-bold mb-2">{f.t}</h3>
                <p className="text-sm text-foreground/60">{f.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-3xl font-bold mb-10">Leadership</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: "Sarah Chen", r: "CEO & Co-Founder", b: "Former Goldman Sachs algorithmic trader." },
              { n: "Marcus Reeve", r: "CTO & Co-Founder", b: "Ex-Stripe principal engineer." },
              { n: "Dr. Aisha Patel", r: "Chief Investment Officer", b: "PhD Quantitative Finance, MIT." },
            ].map((p) => (
              <div key={p.n} className="bg-surface/20 border border-border rounded-lg p-6">
                <div className="size-16 rounded-full bg-primary/20 border border-primary/40 mb-4 grid place-items-center font-display font-bold text-xl">
                  {p.n.split(" ").map((s) => s[0]).join("")}
                </div>
                <p className="font-bold text-lg">{p.n}</p>
                <p className="text-sm text-primary mb-3">{p.r}</p>
                <p className="text-sm text-foreground/60">{p.b}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
