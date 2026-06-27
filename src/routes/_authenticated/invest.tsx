import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { fmtUSD } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/invest")({
  component: InvestPage,
});

function InvestPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<any | null>(null);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: plans } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("investment_plans").select("*").eq("active", true).order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("balance").eq("id", user!.id).single();
      if (error) throw error;
      return data;
    },
  });

  async function handleInvest() {
    const amt = parseFloat(amount);
    if (!selected) return;
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (amt < Number(selected.min_amount)) return toast.error(`Minimum is ${fmtUSD(selected.min_amount)}`);
    if (amt > Number(profile?.balance ?? 0)) return toast.error("Insufficient balance — deposit first");
    setBusy(true);
    const { error } = await supabase.from("investments").insert({
      user_id: user!.id,
      plan_id: selected.id,
      amount: amt,
      monthly_roi: selected.monthly_roi,
      status: "active",
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Invested ${fmtUSD(amt)} in ${selected.name}`);
    setSelected(null);
    setAmount("");
    qc.invalidateQueries();
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <header className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Invest</h1>
          <p className="text-foreground/50 mt-1">Choose a plan and put your capital to work.</p>
        </div>
        <div className="bg-surface/30 border border-border rounded-lg px-5 py-3">
          <p className="text-xs font-bold uppercase tracking-widest text-foreground/40">Available</p>
          <p className="text-2xl font-display font-bold tabular-nums text-positive">{fmtUSD(profile?.balance ?? 0)}</p>
        </div>
      </header>

      {Number(profile?.balance ?? 0) === 0 && (
        <div className="bg-surface/40 border border-primary/30 rounded-lg p-4 flex justify-between items-center">
          <p className="text-sm">You have no balance yet — deposit to start investing.</p>
          <Button asChild size="sm"><Link to="/deposit">Deposit Now</Link></Button>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {plans?.map((p) => (
          <div key={p.id} className={`p-8 rounded-lg border flex flex-col ${p.popular ? "bg-primary text-primary-foreground border-primary" : "bg-surface/20 border-border"}`}>
            <h3 className="font-display text-xl font-bold mb-1">{p.name}</h3>
            <p className={`text-sm mb-6 ${p.popular ? "text-primary-foreground/80" : "text-foreground/50"}`}>{p.description}</p>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-3xl font-display font-bold tabular-nums">{p.monthly_roi}%</span>
              <span className={`text-sm ${p.popular ? "text-primary-foreground/70" : "text-foreground/50"}`}>monthly</span>
            </div>
            <ul className="space-y-2 text-sm mb-6 flex-1">
              {(p.features as string[]).slice(0, 4).map((f, i) => (
                <li key={i} className="flex gap-2"><Check className={`size-4 shrink-0 mt-0.5 ${p.popular ? "" : "text-positive"}`} />{f}</li>
              ))}
            </ul>
            <p className={`text-xs mb-3 ${p.popular ? "text-primary-foreground/70" : "text-foreground/50"}`}>Min. {fmtUSD(p.min_amount)}</p>
            <Button variant={p.popular ? "secondary" : "outline"} className="font-bold" onClick={() => { setSelected(p); setAmount(String(p.min_amount)); }}>
              Invest in {p.name}
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invest in {selected?.name}</DialogTitle>
            <DialogDescription>
              {selected?.monthly_roi}% monthly target return. Minimum {fmtUSD(selected?.min_amount ?? 0)}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="amt">Amount</Label>
            <Input id="amt" type="number" min={selected?.min_amount} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <p className="text-xs text-foreground/50">Available balance: {fmtUSD(profile?.balance ?? 0)}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={handleInvest} disabled={busy}>{busy ? "Investing…" : "Confirm"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
