import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Wallet, TrendingUp, ArrowDownToLine, ArrowUpFromLine, Plus } from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fmtUSD, fmtDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: investments } = useQuery({
    queryKey: ["investments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investments")
        .select("*, plan:investment_plans(name)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: txns } = useQuery({
    queryKey: ["recent-txns", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data;
    },
  });

  const activeInvestments = investments?.filter((i) => i.status === "active") ?? [];

  // Build a synthetic performance series from current balance + total earnings
  const balance = Number(profile?.balance ?? 0);
  const earnings = Number(profile?.total_earnings ?? 0);
  const performance = Array.from({ length: 12 }).map((_, i) => {
    const t = i / 11;
    return {
      m: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
      v: Math.round(Math.max(balance, 100) * (0.6 + 0.4 * t) + earnings * t),
    };
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Welcome back, {profile?.full_name?.split(" ")[0] ?? "investor"}.</h1>
          <p className="text-foreground/50 mt-1">Here's your portfolio at a glance.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild><Link to="/deposit"><Plus className="size-4 mr-2" />Deposit</Link></Button>
          <Button asChild variant="outline"><Link to="/invest">Invest</Link></Button>
          <Button asChild variant="outline"><Link to="/withdraw">Withdraw</Link></Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Wallet} label="Portfolio Value" value={fmtUSD(balance)} accent="primary" />
        <StatCard icon={ArrowDownToLine} label="Total Deposits" value={fmtUSD(profile?.total_deposits ?? 0)} />
        <StatCard icon={TrendingUp} label="Total Earnings" value={fmtUSD(earnings)} accent="positive" />
        <StatCard icon={ArrowUpFromLine} label="Total Withdrawn" value={fmtUSD(profile?.total_withdrawn ?? 0)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface/30 border border-border rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display text-lg font-bold">Portfolio Performance</h2>
            <span className="text-xs text-foreground/40 uppercase tracking-widest">Last 12 months</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performance}>
                <defs>
                  <linearGradient id="dash-g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="m" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickFormatter={(v) => `$${(v/1000).toFixed(1)}k`} />
                <Tooltip
                  contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => fmtUSD(v)}
                />
                <Area type="monotone" dataKey="v" stroke="var(--color-primary)" strokeWidth={2} fill="url(#dash-g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface/30 border border-border rounded-lg p-6">
          <h2 className="font-display text-lg font-bold mb-4">Active Investments</h2>
          {activeInvestments.length === 0 ? (
            <div className="text-sm text-foreground/40 py-8 text-center">
              No active investments.
              <div className="mt-3"><Button asChild size="sm"><Link to="/invest">Start one</Link></Button></div>
            </div>
          ) : (
            <ul className="space-y-3">
              {activeInvestments.slice(0, 5).map((inv: any) => (
                <li key={inv.id} className="border border-border rounded-md p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-sm">{inv.plan?.name ?? "Plan"}</p>
                      <p className="text-xs text-foreground/50">{fmtDate(inv.start_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold tabular-nums text-sm">{fmtUSD(inv.amount)}</p>
                      <p className="text-xs text-positive">+{inv.monthly_roi}%/mo</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-surface/30 border border-border rounded-lg p-6">
        <h2 className="font-display text-lg font-bold mb-4">Recent Transactions</h2>
        {!txns?.length ? (
          <p className="text-sm text-foreground/40 py-8 text-center">No transactions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-widest text-foreground/40 border-b border-border">
                <tr>
                  <th className="py-2">Date</th><th>Type</th><th>Description</th>
                  <th className="text-right">Amount</th><th className="text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {txns.map((t) => (
                  <tr key={t.id} className="border-b border-border/50">
                    <td className="py-3 text-foreground/60">{fmtDate(t.created_at)}</td>
                    <td className="capitalize">{t.type.replace("_", " ")}</td>
                    <td className="text-foreground/60">{t.description ?? "—"}</td>
                    <td className="text-right tabular-nums font-bold">{fmtUSD(t.amount)}</td>
                    <td className="text-right"><StatusBadge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: {
  icon: any; label: string; value: string; accent?: "primary" | "positive";
}) {
  return (
    <div className="bg-surface/30 border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-widest text-foreground/40">{label}</p>
        <Icon className={`size-4 ${accent === "positive" ? "text-positive" : accent === "primary" ? "text-primary" : "text-foreground/40"}`} />
      </div>
      <p className={`text-2xl font-display font-bold tabular-nums ${accent === "positive" ? "text-positive" : ""}`}>{value}</p>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const variant = status === "approved" || status === "completed"
    ? "default"
    : status === "rejected"
    ? "destructive"
    : "secondary";
  return <Badge variant={variant as any} className="capitalize">{status}</Badge>;
}
