import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtUSD, fmtDateTime } from "@/lib/format";
import { StatusBadge } from "./dashboard";

export const Route = createFileRoute("/_authenticated/transactions")({
  component: TransactionsPage,
});

function TransactionsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("all");

  const { data: txns, isLoading } = useQuery({
    queryKey: ["all-txns", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
  });

  const filtered = (txns ?? []).filter((t) => {
    if (type !== "all" && t.type !== type) return false;
    if (search && !(t.description ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <header>
        <h1 className="font-display text-3xl font-bold">Transactions</h1>
        <p className="text-foreground/50 mt-1">Complete history of all financial activity.</p>
      </header>

      <div className="flex flex-wrap gap-3">
        <Input placeholder="Search description…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="max-w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="deposit">Deposits</SelectItem>
            <SelectItem value="withdrawal">Withdrawals</SelectItem>
            <SelectItem value="investment">Investments</SelectItem>
            <SelectItem value="earning">Earnings</SelectItem>
            <SelectItem value="referral_bonus">Referrals</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-surface/30 border border-border rounded-lg p-6">
        {isLoading ? (
          <p className="text-sm text-foreground/40 py-8 text-center">Loading…</p>
        ) : !filtered.length ? (
          <p className="text-sm text-foreground/40 py-8 text-center">No matching transactions.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-widest text-foreground/40 border-b border-border">
                <tr><th className="py-2">Date</th><th>Type</th><th>Description</th><th className="text-right">Amount</th><th className="text-right">Status</th></tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-b border-border/50">
                    <td className="py-3 text-foreground/60">{fmtDateTime(t.created_at)}</td>
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
