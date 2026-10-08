// Convites e ações administrativas do Por Um Fio.
// Ações:
//   peek    { token }                              → mostra para quem é o convite (público)
//   accept  { token, name, email, password }       → cria a conta e liga ao personagem (público)
//   reset   { user_id, password }                  → troca a senha de alguém (só admin)
//   remove  { user_id }                            → remove a conta de alguém (só admin)
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function loadInvite(token: string) {
  if (!token || typeof token !== "string" || token.length > 64) return null;
  const { data } = await admin
    .from("invites")
    .select("token, label, role, character_id, used_at, revoked, characters(name)")
    .eq("token", token)
    .maybeSingle();
  if (!data || data.revoked || data.used_at) return null;
  return data;
}

async function callerIsAdmin(req: Request) {
  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!jwt) return null;
  const { data: u } = await admin.auth.getUser(jwt);
  if (!u?.user) return null;
  const { data: p } = await admin.from("profiles").select("role").eq("user_id", u.user.id).maybeSingle();
  return p?.role === "admin" ? u.user : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "Pedido inválido" }, 400); }
  const action = String(body.action || "");

  if (action === "peek") {
    const inv = await loadInvite(String(body.token || ""));
    if (!inv) return json({ error: "Este convite não existe, já foi usado ou foi cancelado." }, 404);
    // @ts-ignore relação embutida
    return json({ label: inv.label, role: inv.role, character_id: inv.character_id, character: inv.characters?.name ?? null });
  }

  if (action === "accept") {
    const inv = await loadInvite(String(body.token || ""));
    if (!inv) return json({ error: "Este convite não existe, já foi usado ou foi cancelado." }, 404);
    const name = String(body.name || "").trim().slice(0, 60);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!name) return json({ error: "Diga como quer ser chamado." }, 400);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Esse e-mail não parece válido." }, 400);
    if (password.length < 6) return json({ error: "A senha precisa ter pelo menos 6 caracteres." }, 400);

    // marca o convite primeiro, para ninguém usar o mesmo link duas vezes ao mesmo tempo
    const { data: claimed } = await admin
      .from("invites")
      .update({ used_at: new Date().toISOString() })
      .eq("token", inv.token)
      .is("used_at", null)
      .eq("revoked", false)
      .select("token")
      .maybeSingle();
    if (!claimed) return json({ error: "Este convite acabou de ser usado." }, 409);

    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { display_name: name },
    });
    if (cErr || !created?.user) {
      await admin.from("invites").update({ used_at: null }).eq("token", inv.token);
      const msg = /already|registered|exists/i.test(cErr?.message || "")
        ? "Já existe uma conta com esse e-mail. Use outro ou peça ajuda ao administrador."
        : "Não consegui criar a conta agora. Tente de novo.";
      return json({ error: msg }, 400);
    }

    const { error: pErr } = await admin.from("profiles").insert({
      user_id: created.user.id, display_name: name, role: inv.role, character_id: inv.character_id,
    });
    if (pErr) {
      await admin.auth.admin.deleteUser(created.user.id);
      await admin.from("invites").update({ used_at: null }).eq("token", inv.token);
      return json({ error: "Esse personagem já tem um jogador cadastrado." }, 409);
    }
    await admin.from("invites").update({ used_by: created.user.id }).eq("token", inv.token);
    return json({ ok: true });
  }

  if (action === "reset" || action === "remove") {
    const me = await callerIsAdmin(req);
    if (!me) return json({ error: "Só o administrador pode fazer isso." }, 403);
    const userId = String(body.user_id || "");
    if (!userId) return json({ error: "Faltou dizer de quem." }, 400);
    if (action === "reset") {
      const password = String(body.password || "");
      if (password.length < 6) return json({ error: "A senha precisa ter pelo menos 6 caracteres." }, 400);
      const { error } = await admin.auth.admin.updateUserById(userId, { password });
      return error ? json({ error: "Não consegui trocar a senha." }, 400) : json({ ok: true });
    }
    if (userId === me.id) return json({ error: "Você não pode remover a própria conta." }, 400);
    const { error } = await admin.auth.admin.deleteUser(userId);
    return error ? json({ error: "Não consegui remover." }, 400) : json({ ok: true });
  }

  return json({ error: "Ação desconhecida" }, 400);
});
