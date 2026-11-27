import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  ArrowLeft,
  ShieldCheck,
  KeyRound,
  MailQuestion,
  TriangleAlert,
  Copy,
} from "lucide-react";

const ELEVATED_ROLES = ["owner", "admin", "pastor"];

/**
 * Herramienta temporal de bootstrap: intenta crear el primer owner del sitio.
 * - Primero intenta la función edge `setup-owner` (vía oficial).
 * - Luego un fetch "simple" (sin preflight) por si la función existe pero el CORS
 *   no permite el origen de la vista previa.
 * - Si no existe owner todavía, intenta registro directo + asignación de rol.
 * - Si todo falla, muestra los pasos exactos del panel de Supabase.
 *
 * Seguridad: no bypasea RLS; si las políticas son las de las migraciones,
 * un usuario normal no puede elevarse. Eliminar esta página después del uso.
 */
export const SetupOwner = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [setupToken, setSetupToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [stuckUserId, setStuckUserId] = useState<string | null>(null);
  const [recoverEmail, setRecoverEmail] = useState("");
  const [recovering, setRecovering] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const addLog = (line: string) => setLog((prev) => [...prev, line]);

  const readRoles = async (): Promise<string[] | null> => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return null;
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    return data ? data.map((r) => r.role) : [];
  };

  const verifyLogin = async (): Promise<{ ok: boolean; roles: string[]; userId: string | null }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return { ok: false, roles: [], userId: null };
    const roles = await readRoles();
    return { ok: true, roles: roles ?? [], userId: data.user.id };
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || password.length < 8) {
      toast({
        title: "Datos inválidos",
        description: "Ingresa un email válido y una contraseña de al menos 8 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setBusy(true);
    setLog([]);
    setDone(false);
    setStuckUserId(null);

    const body = JSON.stringify({
      email: email.trim(),
      password,
      fullName: "Administrador",
    });

    // ---- Intento 1: función edge oficial ----
    addLog("Intento 1/3 · función edge setup-owner…");
    try {
      const headers: Record<string, string> = {};
      if (setupToken.trim()) headers["x-setup-token"] = setupToken.trim();
      const { data, error } = await supabase.functions.invoke("setup-owner", {
        body: { email: email.trim(), password, fullName: "Administrador" },
        headers,
      });
      if (error) {
        addLog(`  ↳ no disponible: ${error.message}`);
      } else if (data && typeof data === "object" && "error" in data && data.error) {
        addLog(`  ↳ rechazada: ${String(data.error)}`);
      } else {
        addLog("  ↳ función ejecutada ✓");
      }
    } catch (err) {
      addLog(`  ↳ bloqueada por CORS/red (${err instanceof Error ? err.message : "error"})`);
    }

    // ---- Verificación 1 ----
    let result = await verifyLogin();
    if (result.ok && result.roles.some((r) => ELEVATED_ROLES.includes(r))) {
      finishSuccess(result.roles);
      return;
    }
    if (result.ok) {
      // Usuario creado pero sin rol elevado
      setStuckUserId(result.userId);
      addLog("  ⚠ Usuario creado pero sin rol elevado (RLS lo impide).");
      await supabase.auth.signOut();
    }

    // ---- Intento 2: fetch simple sin preflight ----
    addLog("Intento 2/3 · envío directo (sin preflight)…");
    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/setup-owner`, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body,
      });
      addLog("  ↳ enviado (la respuesta puede ser ilegible por CORS)");
    } catch {
      addLog("  ↳ respuesta bloqueada por CORS (el servidor pudo procesarla igual)");
    }

    // ---- Verificación 2 ----
    result = await verifyLogin();
    if (result.ok && result.roles.some((r) => ELEVATED_ROLES.includes(r))) {
      finishSuccess(result.roles);
      return;
    }
    if (result.ok) {
      setStuckUserId(result.userId);
      addLog("  ⚠ Usuario creado pero sin rol elevado.");
      await supabase.auth.signOut();
    }

    // ---- Intento 3: registro directo + intento de asignar rol ----
    addLog("Intento 3/3 · registro directo (signUp)…");
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: "Administrador" } },
    });

    if (signUpError) {
      addLog(`  ↳ ${signUpError.message}`);
      finishFailed();
      return;
    }

    const newUser = signUpData.user;
    if (newUser) setStuckUserId(newUser.id);

    if (!signUpData.session) {
      addLog("  ↳ el proyecto requiere confirmar el email antes de entrar.");
      finishFailed();
      return;
    }

    addLog("  ↳ sesión creada · intentando asignar rol owner…");
    const { error: insertError } = await supabase
      .from("user_roles")
      .insert({ user_id: newUser!.id, role: "owner" });

    if (insertError) {
      addLog(`  ↳ rol rechazado por RLS: ${insertError.message}`);
      await supabase.auth.signOut();
      finishFailed();
      return;
    }

    const roles = await readRoles();
    if (roles && roles.some((r) => ELEVATED_ROLES.includes(r))) {
      finishSuccess(roles);
      return;
    }

    await supabase.auth.signOut();
    finishFailed();
  };

  const finishSuccess = (roles: string[]) => {
    addLog(`✓ Listo · rol: ${roles.join(", ")}`);
    setDone(true);
    setBusy(false);
    toast({
      title: "Usuario admin creado",
      description: `Roles: ${roles.join(", ")}. Ya puedes entrar al panel.`,
    });
  };

  const finishFailed = () => {
    setBusy(false);
    toast({
      title: "No se pudo elevar el rol automáticamente",
      description: "Sigue los pasos del panel de Supabase que aparecen abajo.",
      variant: "destructive",
    });
  };

  const handleRecover = async () => {
    if (!recoverEmail.trim()) {
      toast({ title: "Ingresa el email del usuario", variant: "destructive" });
      return;
    }
    setRecovering(true);
    const { error } = await supabase.auth.resetPasswordForEmail(recoverEmail.trim(), {
      redirectTo: `${window.location.origin}/auth`,
    });
    setRecovering(false);
    toast({
      title: error ? "Error" : "Enlace enviado",
      description: error
        ? error.message
        : "Si ese email existe en el sistema, recibirás un enlace para crear una nueva contraseña.",
      variant: error ? "destructive" : undefined,
    });
  };

  const copySql = () => {
    const sql = `INSERT INTO public.user_roles (user_id, role)
VALUES ('${stuckUserId || "UUID-DEL-USUARIO"}', 'owner')
ON CONFLICT (user_id, role) DO NOTHING;`;
    navigator.clipboard.writeText(sql);
    toast({ title: "SQL copiado al portapapeles" });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <ShieldCheck className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-xl font-heading text-foreground">
              Configuración de Administrador
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Crea el primer usuario con control total del sitio (herramienta temporal)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!done && (
              <form onSubmit={handleCreate} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="setup-email">Email del admin</Label>
                  <Input
                    id="setup-email"
                    type="email"
                    placeholder="admin@tuiglesia.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background/50"
                    disabled={busy}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="setup-password">Contraseña (mínimo 8 caracteres)</Label>
                  <Input
                    id="setup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-background/50"
                    disabled={busy}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="setup-token" className="text-muted-foreground">
                    Token de configuración <span className="text-xs">(opcional)</span>
                  </Label>
                  <Input
                    id="setup-token"
                    type="password"
                    placeholder="Solo si el proyecto exige SETUP_OWNER_SECRET"
                    value={setupToken}
                    onChange={(e) => setSetupToken(e.target.value)}
                    className="bg-background/50"
                    disabled={busy}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando usuario…
                    </>
                  ) : (
                    <>
                      <KeyRound className="mr-2 h-4 w-4" />
                      Crear usuario admin
                    </>
                  )}
                </Button>
              </form>
            )}

            {log.length > 0 && (
              <div className="rounded-lg bg-background/60 border border-border/50 p-3 text-xs font-mono text-muted-foreground space-y-1 max-h-44 overflow-y-auto">
                {log.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            )}

            {done && (
              <div className="rounded-lg border border-primary/40 bg-primary/10 p-4 text-center space-y-3">
                <ShieldCheck className="h-8 w-8 text-primary mx-auto" />
                <p className="text-sm text-foreground font-semibold">
                  Usuario admin creado correctamente
                </p>
                <p className="text-xs text-muted-foreground">
                  {email} ya tiene control total del sitio.
                </p>
                <Button className="w-full" onClick={() => navigate("/auth")}>
                  Ir a iniciar sesión
                </Button>
              </div>
            )}

            {!done && !busy && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 space-y-3">
                <div className="flex items-center gap-2 text-destructive">
                  <TriangleAlert className="h-4 w-4" />
                  <span className="text-sm font-semibold">Si nada funcionó, hazlo en el panel</span>
                </div>
                <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                  <li>
                    Abre{" "}
                    <a
                      href="https://supabase.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      supabase.com/dashboard
                    </a>{" "}
                    → proyecto <code className="text-foreground">pcubjmgstfqdfpftkvuu</code>
                  </li>
                  <li>
                    <strong>Authentication → Users → Add user</strong>: email, contraseña, marca
                    "Auto Confirm User" y guarda. (O busca ahí el usuario anterior si lo recuerdas.)
                  </li>
                  <li>
                    Copia el <strong>UUID</strong> del usuario → <strong>SQL Editor → New query</strong> →
                    pega y ejecuta:
                  </li>
                </ol>
                <div className="flex items-start gap-2">
                  <pre className="flex-1 rounded bg-background/70 border border-border/50 p-2 text-[11px] text-foreground overflow-x-auto">
{`INSERT INTO public.user_roles (user_id, role)
VALUES ('${stuckUserId || "UUID-DEL-USUARIO"}', 'owner')
ON CONFLICT (user_id, role) DO NOTHING;`}
                  </pre>
                  <Button variant="outline" size="icon" onClick={copySql} title="Copiar SQL">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Con ese rol (owner) tendrás control total: contenido, usuarios, roles y
                  configuración.
                </p>
              </div>
            )}

            <div className="border-t border-border/50 pt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <MailQuestion className="h-4 w-4 text-primary" />
                ¿Ya existe un usuario pero olvidaste la contraseña?
              </div>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="email del usuario existente"
                  value={recoverEmail}
                  onChange={(e) => setRecoverEmail(e.target.value)}
                  className="bg-background/50"
                  disabled={recovering}
                />
                <Button variant="outline" onClick={handleRecover} disabled={recovering}>
                  {recovering ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar enlace"}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Supabase enviará un enlace a ese email para restablecer la contraseña. El
                usuario anterior está en <strong>Authentication → Users</strong> del panel.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SetupOwner;
