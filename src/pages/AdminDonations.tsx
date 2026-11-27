import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, CreditCard, Building2, Smartphone, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface DonationConfig {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  paypal_email: string | null;
  bank_name: string | null;
  bank_account: string | null;
  bank_holder: string | null;
  zelle_email: string | null;
  zelle_phone: string | null;
  is_paypal_enabled: boolean;
  is_bank_enabled: boolean;
  is_zelle_enabled: boolean;
}

const AdminDonations = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isPastor, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [config, setConfig] = useState<DonationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankHolder, setBankHolder] = useState("");
  const [zelleEmail, setZelleEmail] = useState("");
  const [zellePhone, setZellePhone] = useState("");
  const [isPaypalEnabled, setIsPaypalEnabled] = useState(false);
  const [isBankEnabled, setIsBankEnabled] = useState(false);
  const [isZelleEnabled, setIsZelleEnabled] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (!authLoading && user && !isAdmin && !isPastor) {
      navigate("/");
    }
  }, [user, isAdmin, isPastor, authLoading, navigate]);

  useEffect(() => {
    const fetchConfig = async () => {
      const { data, error } = await supabase
        .from("donations")
        .select("*")
        .maybeSingle();

      if (!error && data) {
        setConfig(data);
        setTitle(data.title);
        setSubtitle(data.subtitle || "");
        setDescription(data.description || "");
        setPaypalEmail(data.paypal_email || "");
        setBankName(data.bank_name || "");
        setBankAccount(data.bank_account || "");
        setBankHolder(data.bank_holder || "");
        setZelleEmail(data.zelle_email || "");
        setZellePhone(data.zelle_phone || "");
        setIsPaypalEnabled(data.is_paypal_enabled || false);
        setIsBankEnabled(data.is_bank_enabled || false);
        setIsZelleEnabled(data.is_zelle_enabled || false);
      }
      setLoading(false);
    };

    if (user && (isAdmin || isPastor)) {
      fetchConfig();
    }
  }, [user, isAdmin, isPastor]);

  const handleSave = async () => {
    if (!config) return;

    setSaving(true);
    
    const { error } = await supabase
      .from("donations")
      .update({
        title,
        subtitle: subtitle || null,
        description: description || null,
        paypal_email: paypalEmail || null,
        bank_name: bankName || null,
        bank_account: bankAccount || null,
        bank_holder: bankHolder || null,
        zelle_email: zelleEmail || null,
        zelle_phone: zellePhone || null,
        is_paypal_enabled: isPaypalEnabled,
        is_bank_enabled: isBankEnabled,
        is_zelle_enabled: isZelleEnabled,
      })
      .eq("id", config.id);

    setSaving(false);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Guardado",
        description: "La configuración de donaciones se ha actualizado",
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || (!isAdmin && !isPastor)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-3 sm:py-4 px-3 sm:px-4 md:px-6">
        <div className="container mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin")}
              className="text-primary-foreground hover:bg-primary-foreground/10 px-2 sm:px-3"
            >
              <ArrowLeft className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Volver al Admin</span>
            </Button>
            <h1 className="text-base sm:text-lg md:text-xl font-bold uppercase tracking-wide truncate">
              Configurar Donaciones
            </h1>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              size="sm"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 flex-1 sm:flex-none"
            >
              <Save className="w-4 h-4 sm:mr-2" />
              <span className="hidden xs:inline sm:inline">{saving ? "Guardando..." : "Guardar"}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-4xl">
        {/* General Settings */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Información General</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Configura el título y descripción de la página de donaciones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="title" className="text-sm">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Donaciones"
                className="text-sm sm:text-base"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="subtitle" className="text-sm">Subtítulo</Label>
              <Input
                id="subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Tu generosidad hace posible nuestra misión"
                className="text-sm sm:text-base"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="description" className="text-sm">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción de la página de donaciones..."
                rows={3}
                className="text-sm sm:text-base"
              />
            </div>
          </CardContent>
        </Card>

        {/* PayPal */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-sm sm:text-lg truncate">PayPal</CardTitle>
                  <CardDescription className="text-xs sm:text-sm truncate">Acepta donaciones vía PayPal</CardDescription>
                </div>
              </div>
              <Switch
                checked={isPaypalEnabled}
                onCheckedChange={setIsPaypalEnabled}
              />
            </div>
          </CardHeader>
          {isPaypalEnabled && (
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="paypal-email" className="text-sm">Email de PayPal</Label>
                <Input
                  id="paypal-email"
                  type="email"
                  value={paypalEmail}
                  onChange={(e) => setPaypalEmail(e.target.value)}
                  placeholder="donaciones@iglesia.com"
                  className="text-sm sm:text-base"
                />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Bank Transfer */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-sm sm:text-lg truncate">Transferencia Bancaria</CardTitle>
                  <CardDescription className="text-xs sm:text-sm truncate">Información bancaria para transferencias</CardDescription>
                </div>
              </div>
              <Switch
                checked={isBankEnabled}
                onCheckedChange={setIsBankEnabled}
              />
            </div>
          </CardHeader>
          {isBankEnabled && (
            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="bank-name" className="text-sm">Nombre del Banco</Label>
                <Input
                  id="bank-name"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Bank of America"
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="bank-holder" className="text-sm">Titular de la Cuenta</Label>
                <Input
                  id="bank-holder"
                  value={bankHolder}
                  onChange={(e) => setBankHolder(e.target.value)}
                  placeholder="Iglesia CFA"
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="bank-account" className="text-sm">Número de Cuenta</Label>
                <Input
                  id="bank-account"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="1234567890"
                  className="text-sm sm:text-base"
                />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Zelle */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-sm sm:text-lg truncate">Zelle</CardTitle>
                  <CardDescription className="text-xs sm:text-sm truncate">Acepta donaciones vía Zelle</CardDescription>
                </div>
              </div>
              <Switch
                checked={isZelleEnabled}
                onCheckedChange={setIsZelleEnabled}
              />
            </div>
          </CardHeader>
          {isZelleEnabled && (
            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="zelle-email" className="text-sm">Email de Zelle</Label>
                <Input
                  id="zelle-email"
                  type="email"
                  value={zelleEmail}
                  onChange={(e) => setZelleEmail(e.target.value)}
                  placeholder="donaciones@iglesia.com"
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="zelle-phone" className="text-sm">Teléfono de Zelle</Label>
                <Input
                  id="zelle-phone"
                  type="tel"
                  value={zellePhone}
                  onChange={(e) => setZellePhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="text-sm sm:text-base"
                />
              </div>
            </CardContent>
          )}
        </Card>
      </main>
    </div>
  );
};

export default AdminDonations;
