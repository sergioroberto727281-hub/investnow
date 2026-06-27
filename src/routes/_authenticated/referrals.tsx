import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Copy, Users, Gift } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/referrals")({
  component: ReferralsPage,
});

function ReferralsPage() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile-ref", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("referral_code").eq("id", user!.id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: referrals } = useQuery({
    queryKey: ["my-referrals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles").select("id, full_name, created_at").eq("referred_by", user!.id);
      if (error) throw error;
      return data;
    },
  });

  const link = typeof window !== "undefined"
    ? `${window.location.origin}/auth?ref=${profile?.referral_code ?? ""}`
    : "";

  async function copy(t: string) {
    await navigator.clipboard.writeText(t);
    toast.success("Copied to clipboard");
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <header>
        <h1 className="font-display text-3xl font-bold">Referrals</h1>
        <p className="text-foreground/50 mt-1">Earn a bonus when your friends fund their first investment.</p>
      </header>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-surface/30 border border-border rounded-lg p-5">
          <Users className="size-5 text-primary mb-3" />
          <p className="text-xs font-bold uppercase tracking-widest text-foreground/40">Total Referrals</p>
          <p className="text-3xl font-display font-bold tabular-nums">{referrals?.length ?? 0}</p>
        </div>
        <div className="bg-surface/30 border border-border rounded-lg p-5">
          <Gift className="size-5 text-positive mb-3" />
          <p className="text-xs font-bold uppercase tracking-widest text-foreground/40">Bonus Earned</p>
          <p className="text-3xl font-display font-bold tabular-nums text-positive">$0.00</p>
        </div>
        <div className="bg-surface/30 border border-border rounded-lg p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-foreground/40 mb-2">Your Code</p>
          <p className="text-3xl font-display font-bold tabular-nums">{profile?.referral_code ?? "—"}</p>
        </div>
      </div>

      <div className="bg-surface/30 border border-border rounded-lg p-6">
        <h2 className="font-display text-lg font-bold mb-4">Share your link</h2>
        <div className="flex gap-2">
          <Input value={link} readOnly />
          <Button onClick={() => copy(link)}><Copy className="size-4 mr-2" />Copy</Button>
        </div>
      </div>

      <div className="bg-surface/30 border border-border rounded-lg p-6">
        <h2 className="font-display text-lg font-bold mb-4">Referred Users</h2>
        {!referrals?.length ? (
          <p className="text-sm text-foreground/40 py-8 text-center">No referrals yet — share your link to get started.</p>
        ) : (
          <ul className="space-y-2">
            {referrals.map((r) => (
              <li key={r.id} className="flex justify-between border border-border rounded-md p-3 text-sm">
                <span>{r.full_name ?? "Investor"}</span>
                <span className="text-foreground/40">{new Date(r.created_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
