import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — InvestWise" },
      { name: "description", content: "Sign in or create your InvestWise account." },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Invalid email").max(200);
const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(72);

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<"login" | "register">("login");

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="size-6 rounded-sm bg-primary" />
          <span className="font-display text-lg font-bold tracking-tight">INVESTWISE</span>
        </Link>

        <div className="bg-surface/30 border border-border rounded-lg p-8">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Create Account</TabsTrigger>
            </TabsList>
            <TabsContent value="login"><LoginForm /></TabsContent>
            <TabsContent value="register"><RegisterForm onCreated={() => setTab("login")} /></TabsContent>
          </Tabs>
        </div>

        <p className="text-center text-xs text-foreground/40 mt-6">
          <Link to="/" className="hover:text-foreground">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}

function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const emailP = emailSchema.safeParse(email);
    if (!emailP.success) return toast.error(emailP.error.issues[0].message);
    if (!password) return toast.error("Password required");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: emailP.data, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    navigate({ to: "/dashboard" });
  }

  async function handleReset() {
    const emailP = emailSchema.safeParse(resetEmail);
    if (!emailP.success) return toast.error(emailP.error.issues[0].message);
    const { error } = await supabase.auth.resetPasswordForEmail(emailP.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return toast.error(error.message);
    toast.success("Check your email for the reset link");
    setForgot(false);
  }

  return (
    <>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <Label htmlFor="login-email">Email</Label>
          <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div>
          <div className="flex justify-between items-center">
            <Label htmlFor="login-password">Password</Label>
            <button type="button" onClick={() => setForgot(true)} className="text-xs text-primary hover:underline">Forgot?</button>
          </div>
          <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </div>
        <Button type="submit" className="w-full font-bold" disabled={busy}>
          {busy ? "Signing in…" : "Sign In"}
        </Button>
      </form>

      <Dialog open={forgot} onOpenChange={setForgot}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>We'll email you a secure link to set a new password.</DialogDescription>
          </DialogHeader>
          <Input type="email" placeholder="you@example.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setForgot(false)}>Cancel</Button>
            <Button onClick={handleReset}>Send reset link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RegisterForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", referral: "" });
  const [busy, setBusy] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    const emailP = emailSchema.safeParse(form.email);
    if (!emailP.success) return toast.error(emailP.error.issues[0].message);
    const pwP = passwordSchema.safeParse(form.password);
    if (!pwP.success) return toast.error(pwP.error.issues[0].message);
    if (!form.name.trim()) return toast.error("Name required");
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: emailP.data,
      password: pwP.data,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: form.name.trim(),
          referral_code: form.referral.trim() || undefined,
        },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Account created. You're signed in.");
    onCreated();
  }

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <div>
        <Label htmlFor="reg-name">Full name</Label>
        <Input id="reg-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={100} />
      </div>
      <div>
        <Label htmlFor="reg-email">Email</Label>
        <Input id="reg-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoComplete="email" />
      </div>
      <div>
        <Label htmlFor="reg-password">Password</Label>
        <Input id="reg-password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required autoComplete="new-password" minLength={8} />
        <p className="text-xs text-foreground/40 mt-1">At least 8 characters.</p>
      </div>
      <div>
        <Label htmlFor="reg-ref">Referral code (optional)</Label>
        <Input id="reg-ref" value={form.referral} onChange={(e) => setForm({ ...form, referral: e.target.value.toUpperCase() })} maxLength={20} placeholder="ABC12345" />
      </div>
      <Button type="submit" className="w-full font-bold" disabled={busy}>
        {busy ? "Creating account…" : "Create Account"}
      </Button>
    </form>
  );
}
