import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/brand";

export const Route = createFileRoute("/organiser/login")({
  head: () => ({
    meta: [
      { title: "Organiser Login — Tumdo Kalenjin Connect" },
      { name: "description", content: "Sign in to manage events, sales, payments and gate scanning." },
      { property: "og:title", content: "Organiser Login — Tumdo Kalenjin Connect" },
      { property: "og:description", content: "Organiser and staff access." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Login,
});

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  return (
    <div className="grid min-h-screen place-items-center bg-brand p-4">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr("");
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          setBusy(false);
          if (error) return setErr("Invalid email or password");
          nav({ to: "/admin" });
        }}
        className="animate-fade-up w-full max-w-sm space-y-4 rounded-3xl bg-card p-6 shadow-card"
      >
        <div className="flex justify-center rounded-2xl bg-primary py-4"><Logo /></div>
        <div className="text-center">
          <h1 className="text-xl font-black">Organiser Login</h1>
          <p className="text-xs text-muted-foreground">For organisers and gate staff only.</p>
        </div>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-primary" />
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-primary" />
        {err && <p className="text-sm text-destructive">{err}</p>}
        <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 font-bold text-primary-foreground shadow-red">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />} Sign in
        </button>
      </form>
    </div>
  );
}
