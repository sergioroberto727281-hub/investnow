import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — InvestWise" },
      { name: "description", content: "Set a new password for your InvestWise account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const p = z.string().min(8, "At least 8 characters").max(72).safeParse(password);
    if (!p.success) return toast.error(p.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: p.data });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="size-6 rounded-sm bg-primary" />
          <span className="font-display text-lg font-bold tracking-tight">INVESTWISE</span>
        </Link>
        <form onSubmit={handleSubmit} className="bg-surface/30 border border-border rounded-lg p-8 space-y-4">
          <h1 className="font-display text-2xl font-bold mb-2">Set a new password</h1>
          <div>
            <Label htmlFor="new-password">New password</Label>
            <Input id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required autoComplete="new-password" />
          </div>
          <Button type="submit" className="w-full font-bold" disabled={busy}>
            {busy ? "Updating…" : "Update Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
