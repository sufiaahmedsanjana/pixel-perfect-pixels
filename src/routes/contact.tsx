import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Shell, SectionLabel } from "@/components/site/shell";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact & FAQ — Rent-a-Content Studio" },
      {
        name: "description",
        content:
          "Studio location, opening hours, WhatsApp contact and answers about rental rules, cancellations, equipment and booking.",
      },
      { property: "og:title", content: "Contact & FAQ — Rent-a-Content Studio" },
      {
        property: "og:description",
        content: "Get in touch on WhatsApp or email, and read our rental FAQ.",
      },
    ],
  }),
  component: ContactPage,
});

const faqs = [
  {
    q: "Can I bring my own equipment?",
    a: "Absolutely — bring your own cameras and lenses. We just ask you to log any gear you add so our insurance stays valid.",
  },
  {
    q: "How do I get access to the studio?",
    a: "You'll receive a one-time keypad code 24 hours before your confirmed booking, along with parking directions.",
  },
  {
    q: "What's your cancellation policy?",
    a: "Free cancellation up to 24 hours before your slot. Inside 24 hours a 50% fee applies. Reschedule any time from your dashboard.",
  },
  {
    q: "Can I extend my session on the day?",
    a: "Yes, as long as the following slot is still free. Ask the on-site tech or extend from your dashboard.",
  },
  {
    q: "Do you help with lighting and sound?",
    a: "Every room is pre-lit, and a studio tech is on call to help you set up. Full-day and business packages include hands-on support.",
  },
  {
    q: "How is payment handled?",
    a: "Reserve online and settle on arrival by card or transfer. Online card payments are being added shortly.",
  },
];

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      toast.error("Please add your name and a message.");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast.error("That email address doesn't look right.");
      return;
    }
    setSending(true);
    const { error } = await supabase
      .from("contact_messages")
      .insert({ name: name.trim(), email: email.trim(), message: message.trim() });
    setSending(false);
    if (error) {
      toast.error("Your message didn't go through. Please try again.");
      return;
    }
    toast.success("Message sent — we usually reply within a few hours.");
    setName("");
    setEmail("");
    setMessage("");
  }

  return (
    <Shell>
      <section className="py-10">
        <SectionLabel>Contact &amp; FAQ</SectionLabel>
        <h1 className="mt-2 text-4xl font-bold sm:text-5xl">Talk to the studio</h1>
      </section>

      <section className="grid gap-6 pb-10 lg:grid-cols-2">
        <div className="rounded-3xl glass-panel p-7">
          <h2 className="font-display text-xl font-bold">Get in touch</h2>
          <p className="mt-3 text-sm text-ink/60">
            Questions about gear, group rates, or a custom shoot? We reply within a few hours.
          </p>
          <form onSubmit={send} className="mt-5 space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-xl glass-field px-4 py-3 text-sm placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@studio.com"
              className="w-full rounded-xl glass-field px-4 py-3 text-sm placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us about your project"
              className="w-full rounded-xl glass-field px-4 py-3 text-sm placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={sending}
              className="w-full rounded-full bg-ink py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send message"}
            </button>
          </form>
          <a
            href="https://wa.me/15551234567"
            target="_blank"
            rel="noreferrer"
            className="mt-3 block rounded-full glass-panel-strong py-3 text-center text-sm font-semibold text-ink transition hover:bg-white"
          >
            Chat on WhatsApp
          </a>
          <p className="mt-4 text-xs text-ink/50">
            Placeholder contact details — send us your real phone number, address and hours and
            we'll swap them in.
          </p>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl glass-panel p-7">
            <h2 className="font-display text-xl font-bold">Visit us</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-ink/50">Address</dt>
                <dd className="text-right font-medium">120 Lightwell Avenue, Studio 4</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink/50">Hours</dt>
                <dd className="text-right font-medium">Mon–Sun · 9:00 AM – 9:00 PM</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink/50">Phone</dt>
                <dd className="text-right font-medium">+1 555 123 4567</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink/50">Email</dt>
                <dd className="text-right font-medium">hello@rentacontent.studio</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-3xl glass-panel p-7">
            <h2 className="font-display text-xl font-bold">Frequently asked</h2>
            <div className="mt-4 divide-y divide-ink/5">
              {faqs.map((f) => (
                <div key={f.q} className="py-3">
                  <p className="text-sm font-semibold">{f.q}</p>
                  <p className="mt-1 text-sm text-ink/60">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Shell>
  );
}
