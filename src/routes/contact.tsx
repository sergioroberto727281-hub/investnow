import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Mail, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — InvestWise" },
      { name: "description", content: "Get in touch with the InvestWise team. We respond within one business day." },
      { property: "og:title", content: "Contact InvestWise" },
      { property: "og:description", content: "We respond within one business day." },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(1, "Name required").max(100),
  email: z.string().trim().email("Invalid email").max(200),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(1, "Message required").max(4000),
});

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject || null,
      message: parsed.data.message,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Could not send. Please try again.");
      return;
    }
    toast.success("Message sent. We'll be in touch within one business day.");
    setForm({ name: "", email: "", subject: "", message: "" });
  }

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="max-w-2xl mb-12">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Contact</span>
          <h1 className="font-display text-5xl font-extrabold tracking-tight mt-4 mb-4">Get in touch.</h1>
          <p className="text-lg text-foreground/60">
            Questions about plans, your portfolio, or how InvestWise works? We respond within one business day.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-6">
            {[
              { i: Mail, t: "Email", v: "hello@investwise.example" },
              { i: Phone, t: "Phone", v: "+1 (212) 555-0142" },
              { i: MapPin, t: "Office", v: "200 Park Avenue\nNew York, NY 10166" },
            ].map((c) => (
              <div key={c.t} className="bg-surface/20 border border-border rounded-lg p-6">
                <c.i className="size-5 text-primary mb-3" />
                <p className="text-xs font-bold uppercase tracking-widest text-foreground/40 mb-1">{c.t}</p>
                <p className="whitespace-pre-line">{c.v}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="md:col-span-2 bg-surface/20 border border-border rounded-lg p-8 space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={100} />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required maxLength={200} />
              </div>
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} maxLength={200} />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required maxLength={4000} />
            </div>
            <Button type="submit" disabled={submitting} className="font-bold">
              {submitting ? "Sending…" : "Send Message"}
            </Button>
          </form>
        </div>
      </div>
    </SiteShell>
  );
}
