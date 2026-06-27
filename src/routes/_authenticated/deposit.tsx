import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtUSD, fmtDateTime } from "@/lib/format";
import { StatusBadge } from "./dashboard";

export const Route = createFileRoute("/_authenticated/deposit")({
  component: DepositPage,
});

const METHODS = [
  { v: "bank_transfer", l: "Bank Transfer" },
  { v: "crypto_btc", l: "Crypto — BTC" },
  { v: "crypto_usdt", l: "Crypto — USDT (TRC20)" },
  { v: "wire", l: "Wire Transfer" },
];

const schema = z.object({
  amount: z.number().positive("Amount must be greater than 0").max(1_000_000),
  method: z.string().min(1, "Select a payment method"),
  reference: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
});

function DepositPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({ amount: "", method: "", reference: "", notes: "" });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: deposits } = useQuery({
    queryKey: ["my-deposits", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deposits").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({
      amount: parseFloat(form.amount),
      method: form.method,
      reference: form.reference || undefined,
      notes: form.notes || undefined,
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setBusy(true);
    let proofUrl: string | null = null;
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setBusy(false);
        return toast.error("File must be under 5 MB");
      }
      const path = `${user!.id}/${Date.now()}-${file.name.replace(/[^a-z0-9.-]/gi, "_")}`;
      const { error: upErr } = await supabase.storage.from("payment-proofs").upload(path, file);
      if (upErr) {
        setBusy(false);
        return toast.error(`Upload failed: ${upErr.message}`);
      }
      proofUrl = path;
    }

    const { error } = await supabase.from("deposits").insert({
      user_id: user!.id,
      amount: parsed.data.amount,
      method: parsed.data.method,
      reference: parsed.data.reference ?? null,
      notes: parsed.data.notes ?? null,
      proof_url: proofUrl,
      status: "pending",
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Deposit request submitted for review");
    setForm({ amount: "", method: "", reference: "", notes: "" });
    setFile(null);
    qc.invalidateQueries({ queryKey: ["my-deposits"] });
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <header>
        <h1 className="font-display text-3xl font-bold">Deposit Funds</h1>
        <p className="text-foreground/50 mt-1">Submit a deposit request — our team reviews within 24 hours.</p>
      </header>

      <div className="grid lg:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit} className="bg-surface/30 border border-border rounded-lg p-6 space-y-4">
          <div>
            <Label htmlFor="amount">Amount (USD)</Label>
            <Input id="amount" type="number" step="0.01" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required placeholder="100.00" />
          </div>
          <div>
            <Label>Payment method</Label>
            <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
              <SelectTrigger><SelectValue placeholder="Select a method" /></SelectTrigger>
              <SelectContent>
                {METHODS.map((m) => <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="reference">Reference / Transaction ID</Label>
            <Input id="reference" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} maxLength={200} placeholder="Optional — bank ref / tx hash" />
          </div>
          <div>
            <Label htmlFor="proof">Payment proof (image or PDF, &lt; 5 MB)</Label>
            <Input id="proof" type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            {file && <p className="text-xs text-foreground/50 mt-1 flex items-center gap-2"><Upload className="size-3" />{file.name}</p>}
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={1000} />
          </div>
          <Button type="submit" disabled={busy} className="w-full font-bold">
            {busy ? "Submitting…" : "Submit Deposit"}
          </Button>
        </form>

        <PaymentInstructions />
      </div>

      <div className="bg-surface/30 border border-border rounded-lg p-6">
        <h2 className="font-display text-lg font-bold mb-4">Deposit History</h2>
        {!deposits?.length ? (
          <p className="text-sm text-foreground/40 py-8 text-center">No deposits yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-widest text-foreground/40 border-b border-border">
                <tr><th className="py-2">Date</th><th>Method</th><th>Reference</th><th className="text-right">Amount</th><th className="text-right">Status</th></tr>
              </thead>
              <tbody>
                {deposits.map((d) => (
                  <tr key={d.id} className="border-b border-border/50">
                    <td className="py-3 text-foreground/60">{fmtDateTime(d.created_at)}</td>
                    <td className="capitalize">{d.method.replace("_", " ")}</td>
                    <td className="text-foreground/60">{d.reference ?? "—"}</td>
                    <td className="text-right tabular-nums font-bold">{fmtUSD(d.amount)}</td>
                    <td className="text-right"><StatusBadge status={d.status} /></td>
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

function PaymentInstructions() {
  const { data } = useQuery({
    queryKey: ["public-payment-details"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_settings").select("value").eq("key", "payment_details").maybeSingle();
      if (error) throw error;
      return (data?.value ?? {}) as Record<string, string>;
    },
  });
  const v = data ?? {};
  const hasBank = v.bank_name || v.bank_account || v.bank_routing || v.bank_swift;

  return (
    <div className="bg-surface/30 border border-border rounded-lg p-6">
      <h2 className="font-display text-lg font-bold mb-4">Payment Instructions</h2>
      <div className="space-y-4 text-sm">
        {hasBank && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-foreground/40">Bank Transfer</p>
            {v.bank_name && <p className="mt-1">Bank: {v.bank_name}</p>}
            {v.bank_account && <p>Account: {v.bank_account}</p>}
            {v.bank_routing && <p>Routing: {v.bank_routing}</p>}
            {v.bank_swift && <p>SWIFT: {v.bank_swift}</p>}
          </div>
        )}
        {v.btc_address && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-foreground/40">Bitcoin</p>
            <p className="mt-1 break-all font-mono text-xs">{v.btc_address}</p>
          </div>
        )}
        {v.usdt_trc20_address && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-foreground/40">USDT (TRC20)</p>
            <p className="mt-1 break-all font-mono text-xs">{v.usdt_trc20_address}</p>
          </div>
        )}
        {v.usdt_erc20_address && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-foreground/40">USDT (ERC20)</p>
            <p className="mt-1 break-all font-mono text-xs">{v.usdt_erc20_address}</p>
          </div>
        )}
        {v.eth_address && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-foreground/40">Ethereum</p>
            <p className="mt-1 break-all font-mono text-xs">{v.eth_address}</p>
          </div>
        )}
        {v.wire_instructions && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-foreground/40">Wire Transfer</p>
            <p className="mt-1 whitespace-pre-wrap text-xs">{v.wire_instructions}</p>
          </div>
        )}
        {v.notes && (
          <p className="text-xs text-foreground/50 border-t border-border pt-3 whitespace-pre-wrap">{v.notes}</p>
        )}
      </div>
    </div>
  );
}
