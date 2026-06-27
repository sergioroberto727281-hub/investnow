import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Users,
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
  DollarSign,
  Receipt,
  Megaphone,
  Mail,
  UserCog,
  Network,
  BarChart3,
  Pencil,
  Trash2,
  Plus,
  Shield,
  ShieldOff,
  Package,
  Wallet,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ReTooltip,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtUSD, fmtDateTime } from "@/lib/format";
import { StatusBadge } from "./dashboard";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !isAdmin) navigate({ to: "/dashboard" });
  }, [isAdmin, loading, navigate]);

  if (loading || !isAdmin)
    return <div className="text-foreground/40">Checking permissions…</div>;

  return (
    <div className="space-y-6 max-w-7xl">
      <header>
        <h1 className="font-display text-3xl font-bold">Admin Panel</h1>
        <p className="text-foreground/50 mt-1">
          Manage users, approve transactions, and oversee the platform.
        </p>
      </header>

      <AdminStats />
      <AnalyticsChart />

      <Tabs defaultValue="deposits">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="deposits"><ArrowDownToLine className="size-3.5 mr-1.5" />Deposits</TabsTrigger>
          <TabsTrigger value="withdrawals"><ArrowUpFromLine className="size-3.5 mr-1.5" />Withdrawals</TabsTrigger>
          <TabsTrigger value="users"><UserCog className="size-3.5 mr-1.5" />Users</TabsTrigger>
          <TabsTrigger value="investments"><TrendingUp className="size-3.5 mr-1.5" />Investments</TabsTrigger>
          <TabsTrigger value="plans"><Package className="size-3.5 mr-1.5" />Plans</TabsTrigger>
          <TabsTrigger value="payment-details"><Wallet className="size-3.5 mr-1.5" />Payment Details</TabsTrigger>
          <TabsTrigger value="transactions"><Receipt className="size-3.5 mr-1.5" />Transactions</TabsTrigger>
          <TabsTrigger value="referrals"><Network className="size-3.5 mr-1.5" />Referrals</TabsTrigger>
          <TabsTrigger value="announcements"><Megaphone className="size-3.5 mr-1.5" />Announcements</TabsTrigger>
          <TabsTrigger value="emails"><Mail className="size-3.5 mr-1.5" />Emails</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>
        <TabsContent value="deposits"><DepositsAdmin /></TabsContent>
        <TabsContent value="withdrawals"><WithdrawalsAdmin /></TabsContent>
        <TabsContent value="users"><UsersAdmin /></TabsContent>
        <TabsContent value="investments"><InvestmentsAdmin /></TabsContent>
        <TabsContent value="plans"><PlansAdmin /></TabsContent>
        <TabsContent value="payment-details"><PaymentDetailsAdmin /></TabsContent>
        <TabsContent value="transactions"><TransactionsAdmin /></TabsContent>
        <TabsContent value="referrals"><ReferralsAdmin /></TabsContent>
        <TabsContent value="announcements"><AnnouncementsAdmin /></TabsContent>
        <TabsContent value="emails"><EmailSettingsAdmin /></TabsContent>
        <TabsContent value="messages"><MessagesAdmin /></TabsContent>
      </Tabs>
    </div>
  );
}

/* -------------------- Stats + analytics -------------------- */

function AdminStats() {
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [users, deposits, withdrawals, investments] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("deposits").select("amount, status"),
        supabase.from("withdrawals").select("amount, status"),
        supabase.from("investments").select("amount, status"),
      ]);
      const sum = (rows: any[] | null, f: (r: any) => boolean) =>
        (rows ?? []).filter(f).reduce((acc, r) => acc + Number(r.amount), 0);
      return {
        users: users.count ?? 0,
        pendingDeposits: (deposits.data ?? []).filter((d) => d.status === "pending").length,
        pendingWithdrawals: (withdrawals.data ?? []).filter((w) => w.status === "pending").length,
        totalDeposits: sum(deposits.data, (d) => d.status === "approved"),
        activeInvested: sum(investments.data, (i) => i.status === "active"),
      };
    },
  });

  const stats = [
    { i: Users, l: "Total Users", v: data?.users ?? 0, format: (n: number) => n.toLocaleString() },
    { i: ArrowDownToLine, l: "Pending Deposits", v: data?.pendingDeposits ?? 0, format: (n: number) => n.toLocaleString() },
    { i: ArrowUpFromLine, l: "Pending Withdrawals", v: data?.pendingWithdrawals ?? 0, format: (n: number) => n.toLocaleString() },
    { i: DollarSign, l: "Total Deposited", v: data?.totalDeposits ?? 0, format: fmtUSD, accent: "positive" as const },
    { i: TrendingUp, l: "Active Invested", v: data?.activeInvested ?? 0, format: fmtUSD, accent: "primary" as const },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {stats.map((s) => (
        <div key={s.l} className="bg-surface/30 border border-border rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">{s.l}</p>
            <s.i className={`size-3.5 ${s.accent === "positive" ? "text-positive" : s.accent === "primary" ? "text-primary" : "text-foreground/40"}`} />
          </div>
          <p className={`text-xl font-display font-bold tabular-nums ${s.accent === "positive" ? "text-positive" : ""}`}>
            {s.format(s.v as number)}
          </p>
        </div>
      ))}
    </div>
  );
}

function AnalyticsChart() {
  const { data } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 86400_000).toISOString();
      const [d, w, u] = await Promise.all([
        supabase.from("deposits").select("created_at, amount, status").gte("created_at", since),
        supabase.from("withdrawals").select("created_at, amount, status").gte("created_at", since),
        supabase.from("profiles").select("created_at").gte("created_at", since),
      ]);
      const days: Record<string, { day: string; deposits: number; withdrawals: number; signups: number }> = {};
      for (let i = 29; i >= 0; i--) {
        const k = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10);
        days[k] = { day: k.slice(5), deposits: 0, withdrawals: 0, signups: 0 };
      }
      (d.data ?? []).filter((r) => r.status === "approved").forEach((r) => {
        const k = r.created_at.slice(0, 10);
        if (days[k]) days[k].deposits += Number(r.amount);
      });
      (w.data ?? []).filter((r) => r.status === "approved").forEach((r) => {
        const k = r.created_at.slice(0, 10);
        if (days[k]) days[k].withdrawals += Number(r.amount);
      });
      (u.data ?? []).forEach((r) => {
        const k = r.created_at.slice(0, 10);
        if (days[k]) days[k].signups += 1;
      });
      return Object.values(days);
    },
  });

  return (
    <div className="bg-surface/30 border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="size-4 text-primary" />
        <h2 className="font-display font-bold">Last 30 Days</h2>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" stroke="hsl(var(--foreground))" fontSize={10} />
            <YAxis stroke="hsl(var(--foreground))" fontSize={10} />
            <ReTooltip
              contentStyle={{
                background: "hsl(var(--surface))",
                border: "1px solid hsl(var(--border))",
                fontSize: 12,
              }}
            />
            <Line type="monotone" dataKey="deposits" stroke="hsl(var(--positive))" dot={false} />
            <Line type="monotone" dataKey="withdrawals" stroke="hsl(var(--destructive))" dot={false} />
            <Line type="monotone" dataKey="signups" stroke="hsl(var(--primary))" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* -------------------- Deposits -------------------- */

function DepositsAdmin() {
  const qc = useQueryClient();
  const { data: rows } = useQuery({
    queryKey: ["admin-deposits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deposits")
        .select("*, profile:profiles!deposits_user_id_fkey(full_name, email)")
        .order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });

  async function decide(id: string, userId: string, amount: number, action: "approved" | "rejected") {
    const { error } = await supabase.from("deposits").update({
      status: action, reviewed_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) return toast.error(error.message);

    if (action === "approved") {
      const { data: p } = await supabase.from("profiles").select("balance, total_deposits").eq("id", userId).single();
      await supabase.from("profiles").update({
        balance: Number(p?.balance ?? 0) + Number(amount),
        total_deposits: Number(p?.total_deposits ?? 0) + Number(amount),
      }).eq("id", userId);
      await supabase.from("transactions").insert({
        user_id: userId, type: "deposit", amount, status: "completed",
        reference_id: id, description: "Deposit approved",
      });
    }
    toast.success(`Deposit ${action}`);
    qc.invalidateQueries({ queryKey: ["admin-deposits"] });
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
  }

  return <AdminTable rows={rows} columns={["Date", "User", "Method", "Reference", "Amount", "Status", "Actions"]}
    render={(d: any) => [
      fmtDateTime(d.created_at),
      <div key="u"><p className="text-sm">{d.profile?.full_name ?? "—"}</p><p className="text-xs text-foreground/40">{d.profile?.email}</p></div>,
      <span key="m" className="capitalize">{d.method.replace("_", " ")}</span>,
      d.reference ?? "—",
      <span key="a" className="tabular-nums font-bold">{fmtUSD(d.amount)}</span>,
      <StatusBadge key="s" status={d.status} />,
      d.status === "pending" ? (
        <div key="ax" className="flex gap-2">
          <Button size="sm" onClick={() => decide(d.id, d.user_id, d.amount, "approved")}>Approve</Button>
          <Button size="sm" variant="outline" onClick={() => decide(d.id, d.user_id, d.amount, "rejected")}>Reject</Button>
        </div>
      ) : "—",
    ]}
  />;
}

/* -------------------- Withdrawals -------------------- */

function WithdrawalsAdmin() {
  const qc = useQueryClient();
  const { data: rows } = useQuery({
    queryKey: ["admin-withdrawals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawals")
        .select("*, profile:profiles!withdrawals_user_id_fkey(full_name, email)")
        .order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });

  async function decide(id: string, userId: string, amount: number, action: "approved" | "rejected") {
    const { error } = await supabase.from("withdrawals").update({
      status: action, reviewed_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) return toast.error(error.message);

    if (action === "approved") {
      const { data: p } = await supabase.from("profiles").select("balance, total_withdrawn").eq("id", userId).single();
      const newBal = Math.max(0, Number(p?.balance ?? 0) - Number(amount));
      await supabase.from("profiles").update({
        balance: newBal,
        total_withdrawn: Number(p?.total_withdrawn ?? 0) + Number(amount),
      }).eq("id", userId);
      await supabase.from("transactions").insert({
        user_id: userId, type: "withdrawal", amount, status: "completed",
        reference_id: id, description: "Withdrawal processed",
      });
    }
    toast.success(`Withdrawal ${action}`);
    qc.invalidateQueries({ queryKey: ["admin-withdrawals"] });
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
  }

  return <AdminTable rows={rows} columns={["Date", "User", "Bank", "Account", "Amount", "Status", "Actions"]}
    render={(w: any) => [
      fmtDateTime(w.created_at),
      <div key="u"><p className="text-sm">{w.profile?.full_name ?? "—"}</p><p className="text-xs text-foreground/40">{w.profile?.email}</p></div>,
      w.bank_name,
      <span key="a" className="text-foreground/60">••••{w.account_number?.slice(-4)}</span>,
      <span key="amt" className="tabular-nums font-bold">{fmtUSD(w.amount)}</span>,
      <StatusBadge key="s" status={w.status} />,
      w.status === "pending" ? (
        <div key="ax" className="flex gap-2">
          <Button size="sm" onClick={() => decide(w.id, w.user_id, w.amount, "approved")}>Approve</Button>
          <Button size="sm" variant="outline" onClick={() => decide(w.id, w.user_id, w.amount, "rejected")}>Reject</Button>
        </div>
      ) : "—",
    ]}
  />;
}

/* -------------------- Users (with edit + role toggle) -------------------- */

function UsersAdmin() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<any | null>(null);

  const { data: rows } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [profiles, roles] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      const roleMap = new Map<string, string[]>();
      (roles.data ?? []).forEach((r) => {
        const list = roleMap.get(r.user_id) ?? [];
        list.push(r.role);
        roleMap.set(r.user_id, list);
      });
      return (profiles.data ?? []).map((p) => ({ ...p, roles: roleMap.get(p.id) ?? [] }));
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rows ?? [];
    return (rows ?? []).filter((u) =>
      (u.email ?? "").toLowerCase().includes(q) ||
      (u.full_name ?? "").toLowerCase().includes(q) ||
      (u.referral_code ?? "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  async function toggleAdmin(userId: string, isAdmin: boolean) {
    if (isAdmin) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
      if (error) return toast.error(error.message);
      toast.success("Admin role revoked");
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
      if (error) return toast.error(error.message);
      toast.success("Admin role granted");
    }
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  }

  return (
    <div className="space-y-3 mt-4">
      <Input placeholder="Search by name, email, or referral code…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
      <AdminTable rows={filtered} columns={["Joined", "Name", "Email", "Balance", "Deposits", "Earnings", "Role", "Actions"]}
        render={(u: any) => {
          const isAdmin = u.roles.includes("admin");
          return [
            fmtDateTime(u.created_at), u.full_name ?? "—", u.email ?? "—",
            <span key="b" className="tabular-nums font-bold">{fmtUSD(u.balance)}</span>,
            <span key="d" className="tabular-nums">{fmtUSD(u.total_deposits)}</span>,
            <span key="e" className="tabular-nums text-positive">{fmtUSD(u.total_earnings)}</span>,
            <span key="r" className={`text-xs uppercase tracking-widest ${isAdmin ? "text-primary" : "text-foreground/40"}`}>{isAdmin ? "Admin" : "User"}</span>,
            <div key="ax" className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditing(u)}><Pencil className="size-3.5" /></Button>
              <Button size="sm" variant="outline" onClick={() => toggleAdmin(u.id, isAdmin)}>
                {isAdmin ? <ShieldOff className="size-3.5" /> : <Shield className="size-3.5" />}
              </Button>
            </div>,
          ];
        }}
      />
      {editing && (
        <EditUserDialog
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            qc.invalidateQueries({ queryKey: ["admin-users"] });
            qc.invalidateQueries({ queryKey: ["admin-stats"] });
          }}
        />
      )}
    </div>
  );
}

function EditUserDialog({ user, onClose, onSaved }: { user: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    full_name: user.full_name ?? "",
    email: user.email ?? "",
    phone: user.phone ?? "",
    balance: String(user.balance ?? 0),
    total_deposits: String(user.total_deposits ?? 0),
    total_withdrawn: String(user.total_withdrawn ?? 0),
    total_earnings: String(user.total_earnings ?? 0),
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name,
      email: form.email,
      phone: form.phone || null,
      balance: Number(form.balance) || 0,
      total_deposits: Number(form.total_deposits) || 0,
      total_withdrawn: Number(form.total_withdrawn) || 0,
      total_earnings: Number(form.total_earnings) || 0,
    }).eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("User updated");
    onSaved();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Edit user</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {([
            ["full_name", "Full name", "text"],
            ["email", "Email", "email"],
            ["phone", "Phone", "tel"],
            ["balance", "Balance", "number"],
            ["total_deposits", "Total deposits", "number"],
            ["total_withdrawn", "Total withdrawn", "number"],
            ["total_earnings", "Total earnings", "number"],
          ] as const).map(([k, label, type]) => (
            <div key={k} className={k === "full_name" || k === "email" ? "col-span-2" : ""}>
              <Label className="text-xs">{label}</Label>
              <Input type={type} value={(form as any)[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------- Investments -------------------- */

function InvestmentsAdmin() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const { data: rows } = useQuery({
    queryKey: ["admin-investments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investments")
        .select("*, profile:profiles!investments_user_id_fkey(full_name, email), plan:investment_plans(name)")
        .order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });

  async function cancel(id: string) {
    if (!confirm("Cancel this investment?")) return;
    const { error } = await supabase.from("investments").update({ status: "cancelled" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Investment cancelled");
    qc.invalidateQueries({ queryKey: ["admin-investments"] });
  }
  async function complete(id: string) {
    const { error } = await supabase.from("investments").update({ status: "completed", end_date: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Investment marked complete");
    qc.invalidateQueries({ queryKey: ["admin-investments"] });
  }

  return (
    <>
      <AdminTable rows={rows} columns={["Started", "User", "Plan", "Amount", "ROI/mo", "Earnings", "Status", "Actions"]}
        render={(inv: any) => [
          fmtDateTime(inv.created_at),
          <div key="u"><p className="text-sm">{inv.profile?.full_name ?? "—"}</p><p className="text-xs text-foreground/40">{inv.profile?.email}</p></div>,
          inv.plan?.name ?? "—",
          <span key="a" className="tabular-nums font-bold">{fmtUSD(inv.amount)}</span>,
          <span key="r" className="tabular-nums">{Number(inv.monthly_roi).toFixed(2)}%</span>,
          <span key="e" className="tabular-nums text-positive">{fmtUSD(inv.earnings)}</span>,
          <StatusBadge key="s" status={inv.status} />,
          <div key="ax" className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(inv)}><Pencil className="size-3.5" /></Button>
            {inv.status === "active" && <>
              <Button size="sm" variant="outline" onClick={() => complete(inv.id)}>Complete</Button>
              <Button size="sm" variant="outline" onClick={() => cancel(inv.id)}>Cancel</Button>
            </>}
          </div>,
        ]}
      />
      {editing && (
        <EditInvestmentDialog
          inv={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            qc.invalidateQueries({ queryKey: ["admin-investments"] });
          }}
        />
      )}
    </>
  );
}

function EditInvestmentDialog({ inv, onClose, onSaved }: { inv: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    amount: String(inv.amount),
    monthly_roi: String(inv.monthly_roi),
    earnings: String(inv.earnings),
    status: inv.status as "active" | "completed" | "cancelled",
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("investments").update({
      amount: Number(form.amount),
      monthly_roi: Number(form.monthly_roi),
      earnings: Number(form.earnings),
      status: form.status,
    }).eq("id", inv.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Investment updated");
    onSaved();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit investment</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Amount</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
          <div><Label className="text-xs">Monthly ROI %</Label><Input type="number" step="0.01" value={form.monthly_roi} onChange={(e) => setForm({ ...form, monthly_roi: e.target.value })} /></div>
          <div><Label className="text-xs">Earnings</Label><Input type="number" value={form.earnings} onChange={(e) => setForm({ ...form, earnings: e.target.value })} /></div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------- Transactions -------------------- */

function TransactionsAdmin() {
  const [filter, setFilter] = useState<string>("all");
  const { data: rows } = useQuery({
    queryKey: ["admin-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*, profile:profiles!transactions_user_id_fkey(full_name, email)")
        .order("created_at", { ascending: false }).limit(300);
      if (error) throw error;
      return data;
    },
  });
  const filtered = (rows ?? []).filter((t) => filter === "all" || t.type === filter);

  return (
    <div className="space-y-3 mt-4">
      <Select value={filter} onValueChange={setFilter}>
        <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          <SelectItem value="deposit">Deposit</SelectItem>
          <SelectItem value="withdrawal">Withdrawal</SelectItem>
          <SelectItem value="investment">Investment</SelectItem>
          <SelectItem value="earning">Earning</SelectItem>
          <SelectItem value="referral_bonus">Referral bonus</SelectItem>
        </SelectContent>
      </Select>
      <AdminTable rows={filtered} columns={["Date", "User", "Type", "Amount", "Status", "Description"]}
        render={(t: any) => [
          fmtDateTime(t.created_at),
          <div key="u"><p className="text-sm">{t.profile?.full_name ?? "—"}</p><p className="text-xs text-foreground/40">{t.profile?.email}</p></div>,
          <span key="t" className="capitalize">{t.type.replace("_", " ")}</span>,
          <span key="a" className="tabular-nums font-bold">{fmtUSD(t.amount)}</span>,
          <StatusBadge key="s" status={t.status} />,
          <span key="d" className="text-xs text-foreground/60">{t.description ?? "—"}</span>,
        ]}
      />
    </div>
  );
}

/* -------------------- Referrals -------------------- */

function ReferralsAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-referrals"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, referral_code, referred_by")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const byId = new Map(profiles!.map((p) => [p.id, p]));
      const groups = new Map<string, any[]>();
      profiles!.forEach((p) => {
        if (!p.referred_by) return;
        const list = groups.get(p.referred_by) ?? [];
        list.push(p);
        groups.set(p.referred_by, list);
      });
      return Array.from(groups.entries())
        .map(([refId, referrals]) => ({ referrer: byId.get(refId), referrals }))
        .filter((g) => g.referrer)
        .sort((a, b) => b.referrals.length - a.referrals.length);
    },
  });

  async function payBonus(userId: string) {
    const raw = prompt("Bonus amount in USD:");
    const amount = Number(raw);
    if (!amount || amount <= 0) return;
    const { data: p } = await supabase.from("profiles").select("balance, total_earnings").eq("id", userId).single();
    const { error } = await supabase.from("profiles").update({
      balance: Number(p?.balance ?? 0) + amount,
      total_earnings: Number(p?.total_earnings ?? 0) + amount,
    }).eq("id", userId);
    if (error) return toast.error(error.message);
    await supabase.from("transactions").insert({
      user_id: userId, type: "referral_bonus", amount, status: "completed",
      description: "Referral bonus credited by admin",
    });
    toast.success(`Credited ${fmtUSD(amount)}`);
    qc.invalidateQueries({ queryKey: ["admin-referrals"] });
  }

  if (!data) return <p className="text-sm text-foreground/40 py-8 text-center mt-4">Loading…</p>;
  if (!data.length) return <p className="text-sm text-foreground/40 py-8 text-center mt-4">No referrals yet.</p>;

  return (
    <div className="space-y-3 mt-4">
      {data.map((g) => (
        <div key={g.referrer!.id} className="bg-surface/30 border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-bold">{g.referrer!.full_name ?? g.referrer!.email}</p>
              <p className="text-xs text-foreground/40">Code: {g.referrer!.referral_code} · {g.referrals.length} referral{g.referrals.length === 1 ? "" : "s"}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => payBonus(g.referrer!.id)}>
              <DollarSign className="size-3.5 mr-1" /> Pay bonus
            </Button>
          </div>
          <ul className="text-xs text-foreground/60 space-y-1 pl-4 border-l border-border">
            {g.referrals.map((r) => (
              <li key={r.id}>↳ {r.full_name ?? r.email}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* -------------------- Announcements -------------------- */

function AnnouncementsAdmin() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const { data: rows } = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: async () => {
      const { data, error } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function remove(id: string) {
    if (!confirm("Delete this announcement?")) return;
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-announcements"] });
  }
  async function toggleActive(a: any) {
    const { error } = await supabase.from("announcements").update({ active: !a.active }).eq("id", a.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-announcements"] });
  }

  return (
    <div className="space-y-3 mt-4">
      <div className="flex justify-end">
        <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="size-4 mr-1" /> New announcement</Button>
      </div>
      <AdminTable rows={rows} columns={["Date", "Title", "Body", "Active", "Actions"]}
        render={(a: any) => [
          fmtDateTime(a.created_at), a.title,
          <p key="b" className="text-xs text-foreground/60 max-w-md truncate">{a.body}</p>,
          <Switch key="sw" checked={a.active} onCheckedChange={() => toggleActive(a)} />,
          <div key="ax" className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { setEditing(a); setOpen(true); }}><Pencil className="size-3.5" /></Button>
            <Button size="sm" variant="outline" onClick={() => remove(a.id)}><Trash2 className="size-3.5" /></Button>
          </div>,
        ]}
      />
      {open && (
        <AnnouncementDialog
          announcement={editing}
          onClose={() => setOpen(false)}
          onSaved={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["admin-announcements"] }); }}
        />
      )}
    </div>
  );
}

function AnnouncementDialog({ announcement, onClose, onSaved }: { announcement: any | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    title: announcement?.title ?? "",
    body: announcement?.body ?? "",
    active: announcement?.active ?? true,
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!form.title.trim() || !form.body.trim()) return toast.error("Title and body required");
    setSaving(true);
    const payload = { title: form.title, body: form.body, active: form.active };
    const op = announcement
      ? supabase.from("announcements").update(payload).eq("id", announcement.id)
      : supabase.from("announcements").insert(payload);
    const { error } = await op;
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(announcement ? "Updated" : "Created");
    onSaved();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{announcement ? "Edit" : "New"} announcement</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><Label className="text-xs">Body</Label><Textarea rows={5} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
          <div className="flex items-center gap-2"><Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /><Label className="text-xs">Active</Label></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------- Email notifications -------------------- */

const EMAIL_EVENTS: { key: string; label: string; desc: string }[] = [
  { key: "deposit_approved", label: "Deposit approved", desc: "Notify users when their deposit is approved." },
  { key: "withdrawal_approved", label: "Withdrawal approved", desc: "Notify users when a withdrawal is processed." },
  { key: "new_user", label: "New user welcome", desc: "Send a welcome email on signup." },
  { key: "investment_completed", label: "Investment completed", desc: "Notify users when their investment matures." },
];

function EmailSettingsAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["email-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_settings").select("value").eq("key", "email_notifications").maybeSingle();
      if (error) throw error;
      return (data?.value ?? {}) as Record<string, boolean>;
    },
  });

  async function toggle(key: string, on: boolean) {
    const next = { ...(data ?? {}), [key]: on };
    const { error } = await supabase.from("app_settings").upsert({ key: "email_notifications", value: next, updated_at: new Date().toISOString() });
    if (error) return toast.error(error.message);
    qc.setQueryData(["email-settings"], next);
    toast.success("Saved");
  }

  return (
    <div className="space-y-3 mt-4">
      <div className="bg-surface/30 border border-border rounded-lg p-4 text-xs text-foreground/60">
        <p className="flex items-start gap-2">
          <Mail className="size-4 text-primary shrink-0 mt-0.5" />
          <span>Toggle which platform events send email notifications to users. Connect an email provider to start delivery.</span>
        </p>
      </div>
      <div className="bg-surface/30 border border-border rounded-lg divide-y divide-border">
        {EMAIL_EVENTS.map((e) => (
          <div key={e.key} className="p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-sm">{e.label}</p>
              <p className="text-xs text-foreground/50">{e.desc}</p>
            </div>
            <Switch checked={!!data?.[e.key]} onCheckedChange={(v) => toggle(e.key, v)} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------- Messages -------------------- */

function MessagesAdmin() {
  const qc = useQueryClient();
  const { data: rows } = useQuery({
    queryKey: ["admin-messages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });
  async function markHandled(id: string) {
    await supabase.from("contact_messages").update({ handled: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-messages"] });
  }
  return <AdminTable rows={rows} columns={["Date", "Name", "Email", "Subject", "Message", "Actions"]}
    render={(m: any) => [
      fmtDateTime(m.created_at), m.name, m.email, m.subject ?? "—",
      <p key="msg" className="text-sm max-w-md truncate">{m.message}</p>,
      m.handled ? <span key="h" className="text-positive text-xs">✓ Handled</span> :
        <Button key="h" size="sm" variant="outline" onClick={() => markHandled(m.id)}>Mark handled</Button>,
    ]}
  />;
}

/* -------------------- Shared table -------------------- */

function AdminTable({ rows, columns, render }: {
  rows: any[] | undefined;
  columns: string[];
  render: (row: any) => React.ReactNode[];
}) {
  if (!rows) return <p className="text-sm text-foreground/40 py-8 text-center">Loading…</p>;
  if (!rows.length) return <p className="text-sm text-foreground/40 py-8 text-center">No records.</p>;
  return (
    <div className="bg-surface/30 border border-border rounded-lg overflow-x-auto mt-4">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-widest text-foreground/40 border-b border-border">
          <tr>{columns.map((c) => <th key={c} className="py-3 px-4">{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id ?? i} className="border-b border-border/50">
              {render(row).map((cell, j) => <td key={j} className="py-3 px-4 align-top">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------- Investment Plans -------------------- */

function PlansAdmin() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const { data: rows } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("investment_plans").select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  async function remove(id: string) {
    if (!confirm("Delete this plan? Existing investments will keep their data.")) return;
    const { error } = await supabase.from("investment_plans").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Plan deleted");
    qc.invalidateQueries({ queryKey: ["admin-plans"] });
  }
  async function toggleActive(p: any) {
    const { error } = await supabase.from("investment_plans").update({ active: !p.active }).eq("id", p.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-plans"] });
  }

  return (
    <div className="space-y-3 mt-4">
      <div className="flex justify-end">
        <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="size-4 mr-1" /> New plan</Button>
      </div>
      <AdminTable rows={rows} columns={["Order", "Name", "Range", "Monthly ROI", "Duration", "Popular", "Active", "Actions"]}
        render={(p: any) => [
          <span key="o" className="tabular-nums text-foreground/60">{p.sort_order}</span>,
          <div key="n"><p className="font-medium">{p.name}</p><p className="text-xs text-foreground/40">{p.slug}</p></div>,
          <span key="r" className="tabular-nums text-xs">{fmtUSD(p.min_amount)} – {fmtUSD(p.max_amount)}</span>,
          <span key="roi" className="tabular-nums">{Number(p.monthly_roi).toFixed(2)}%</span>,
          <span key="d">{p.duration_months} mo</span>,
          p.popular ? <span key="pp" className="text-primary text-xs">★</span> : "—",
          <Switch key="sw" checked={p.active} onCheckedChange={() => toggleActive(p)} />,
          <div key="ax" className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { setEditing(p); setOpen(true); }}><Pencil className="size-3.5" /></Button>
            <Button size="sm" variant="outline" onClick={() => remove(p.id)}><Trash2 className="size-3.5" /></Button>
          </div>,
        ]}
      />
      {open && (
        <PlanDialog
          plan={editing}
          onClose={() => setOpen(false)}
          onSaved={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["admin-plans"] }); }}
        />
      )}
    </div>
  );
}

function PlanDialog({ plan, onClose, onSaved }: { plan: any | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: plan?.name ?? "",
    slug: plan?.slug ?? "",
    description: plan?.description ?? "",
    min_amount: String(plan?.min_amount ?? 100),
    max_amount: String(plan?.max_amount ?? 1000),
    monthly_roi: String(plan?.monthly_roi ?? 5),
    duration_months: String(plan?.duration_months ?? 6),
    features: Array.isArray(plan?.features) ? plan.features.join("\n") : "",
    sort_order: String(plan?.sort_order ?? 0),
    popular: plan?.popular ?? false,
    active: plan?.active ?? true,
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!form.name.trim() || !form.slug.trim()) return toast.error("Name and slug required");
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim().toLowerCase().replace(/\s+/g, "-"),
      description: form.description || null,
      min_amount: Number(form.min_amount) || 0,
      max_amount: Number(form.max_amount) || 0,
      monthly_roi: Number(form.monthly_roi) || 0,
      duration_months: Number(form.duration_months) || 1,
      features: form.features.split("\n").map((s: string) => s.trim()).filter(Boolean),
      sort_order: Number(form.sort_order) || 0,
      popular: form.popular,
      active: form.active,
    };
    const op = plan
      ? supabase.from("investment_plans").update(payload).eq("id", plan.id)
      : supabase.from("investment_plans").insert(payload);
    const { error } = await op;
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(plan ? "Plan updated" : "Plan created");
    onSaved();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>{plan ? "Edit" : "New"} investment plan</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto pr-1">
          <div className="col-span-2"><Label className="text-xs">Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label className="text-xs">Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="starter" /></div>
          <div><Label className="text-xs">Sort order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></div>
          <div className="col-span-2"><Label className="text-xs">Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div><Label className="text-xs">Min amount (USD)</Label><Input type="number" value={form.min_amount} onChange={(e) => setForm({ ...form, min_amount: e.target.value })} /></div>
          <div><Label className="text-xs">Max amount (USD)</Label><Input type="number" value={form.max_amount} onChange={(e) => setForm({ ...form, max_amount: e.target.value })} /></div>
          <div><Label className="text-xs">Monthly ROI %</Label><Input type="number" step="0.01" value={form.monthly_roi} onChange={(e) => setForm({ ...form, monthly_roi: e.target.value })} /></div>
          <div><Label className="text-xs">Duration (months)</Label><Input type="number" value={form.duration_months} onChange={(e) => setForm({ ...form, duration_months: e.target.value })} /></div>
          <div className="col-span-2"><Label className="text-xs">Features (one per line)</Label><Textarea rows={4} value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder={"Priority support\nMonthly reports"} /></div>
          <div className="flex items-center gap-2"><Switch checked={form.popular} onCheckedChange={(v) => setForm({ ...form, popular: v })} /><Label className="text-xs">Popular</Label></div>
          <div className="flex items-center gap-2"><Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /><Label className="text-xs">Active</Label></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------- Payment Details -------------------- */

const PAYMENT_FIELDS: { key: string; label: string; placeholder?: string; textarea?: boolean }[] = [
  { key: "bank_name", label: "Bank name" },
  { key: "bank_account", label: "Bank account number" },
  { key: "bank_routing", label: "Routing number" },
  { key: "bank_swift", label: "SWIFT / BIC" },
  { key: "btc_address", label: "Bitcoin (BTC) address" },
  { key: "usdt_trc20_address", label: "USDT TRC20 address" },
  { key: "usdt_erc20_address", label: "USDT ERC20 address" },
  { key: "eth_address", label: "Ethereum (ETH) address" },
  { key: "wire_instructions", label: "Wire transfer instructions", textarea: true },
  { key: "notes", label: "Footer note shown to users", textarea: true },
];

function PaymentDetailsAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["payment-details"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_settings").select("value").eq("key", "payment_details").maybeSingle();
      if (error) throw error;
      return (data?.value ?? {}) as Record<string, string>;
    },
  });
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("app_settings").upsert({
      key: "payment_details", value: form, updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Payment details saved");
    qc.invalidateQueries({ queryKey: ["payment-details"] });
    qc.invalidateQueries({ queryKey: ["public-payment-details"] });
  }

  return (
    <div className="space-y-3 mt-4">
      <div className="bg-surface/30 border border-border rounded-lg p-4 text-xs text-foreground/60 flex items-start gap-2">
        <Wallet className="size-4 text-primary shrink-0 mt-0.5" />
        <span>These values appear on the user Deposit page as payment instructions. Leave any field blank to hide it.</span>
      </div>
      <div className="bg-surface/30 border border-border rounded-lg p-6 space-y-3">
        {PAYMENT_FIELDS.map((f) => (
          <div key={f.key}>
            <Label className="text-xs">{f.label}</Label>
            {f.textarea ? (
              <Textarea rows={3} value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
            ) : (
              <Input value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder} />
            )}
          </div>
        ))}
        <div className="flex justify-end pt-2">
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save payment details"}</Button>
        </div>
      </div>
    </div>
  );
}
