import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fmtUSD, fmtDateTime } from "@/lib/format";
import { StatusBadge } from "./dashboard";

export const Route = createFileRoute("/_authenticated/withdraw")({
  component: WithdrawPage,
});

const schema = z.object({
  amount: z.number().positive("Amount must be greater than 0").max(1_000_000),
  bank_name: z.string().min(1, "Bank name required").max(100),
  account_name: z.string().min(1, "Account holder required").max(100),
  account_number: z.string().min(4, "Account number required").max(50),
  routing_info: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
});

function WithdrawPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({ amount: "", bank_name: "", account_name: "", account_number: "", routing_info: "", notes: "" });
  const [busy, setBusy] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("balance").eq("id", user!.id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: withdrawals } = useQuery({
    queryKey: ["my-withdrawals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawals").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({
      ...form,
      amount: parseFloat(form.amount),
      routing_info: form.routing_info || undefined,
      notes: form.notes || undefined,
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (parsed.data.amount > Number(profile?.balance ?? 0)) {
      return toast.error("Withdrawal exceeds available balance");
    }
    setBusy(true);
    const { error } = await supabase.from("withdrawals").insert({
      user_id: user!.id,
      ...parsed.data,
      routing_info: parsed.data.routing_info ?? null,
      notes: parsed.data.notes ?? null,
      status: "pending",
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Withdrawal request submitted");
    setForm({ amount: "", bank_name: "", account_name: "", account_number: "", routing_info: "", notes: "" });
    qc.invalidateQueries({ queryKey: ["my-withdrawals"] });
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <header className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Withdraw Funds</h1>
          <p className="text-foreground/50 mt-1">Withdrawals process within 1–3 business days.</p>
        </div>
        <div className="bg-surface/30 border border-border rounded-lg px-5 py-3">
          <p className="text-xs font-bold uppercase tracking-widest text-foreground/40">Available</p>
          <p className="text-2xl font-display font-bold tabular-nums text-positive">{fmtUSD(profile?.balance ?? 0)}</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="bg-surface/30 border border-border rounded-lg p-6 grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="amount">Amount (USD)</Label>
          <Input id="amount" type="number" step="0.01" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
        </div>
        <div>
          <Label htmlFor="bank">Bank name</Label>
          <Input id="bank" value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} required maxLength={100} />
        </div>
        <div>
          <Label htmlFor="holder">Account holder</Label>
          <Input id="holder" value={form.account_name} onChange={(e) => setForm({ ...form, account_name: e.target.value })} required maxLength={100} />
        </div>
        <div>
          <Label htmlFor="acct">Account number / IBAN</Label>
          <Input id="acct" value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} required maxLength={50} />
        </div>
        <div>
          <Label htmlFor="routing">Routing / SWIFT (optional)</Label>
          <Input id="routing" value={form.routing_info} onChange={(e) => setForm({ ...form, routing_info: e.target.value })} maxLength={100} />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={1000} />
        </div>
        <div className="md:col-span-2">
          <Button type="submit" disabled={busy} className="font-bold">{busy ? "Submitting…" : "Request Withdrawal"}</Button>
        </div>
      </form>

      <div className="bg-surface/30 border border-border rounded-lg p-6">
        <h2 className="font-display text-lg font-bold mb-4">Withdrawal History</h2>
        {!withdrawals?.length ? (
          <p className="text-sm text-foreground/40 py-8 text-center">No withdrawals yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-widest text-foreground/40 border-b border-border">
                <tr><th className="py-2">Date</th><th>Bank</th><th>Account</th><th className="text-right">Amount</th><th className="text-right">Status</th></tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id} className="border-b border-border/50">
                    <td className="py-3 text-foreground/60">{fmtDateTime(w.created_at)}</td>
                    <td>{w.bank_name}</td>
                    <td className="text-foreground/60">••••{w.account_number?.slice(-4)}</td>
                    <td className="text-right tabular-nums font-bold">{fmtUSD(w.amount)}</td>
                    <td className="text-right"><StatusBadge status={w.status} /></td>
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
