import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Heart, CreditCard, Building2, Smartphone, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

const Donations = () => {
  const [config, setConfig] = useState<DonationConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      const { data, error } = await supabase
        .from("donations")
        .select("*")
        .maybeSingle();

      if (!error && data) {
        setConfig(data);
      }
      setLoading(false);
    };

    fetchConfig();
  }, []);

  // Count enabled methods
  const getEnabledMethodsCount = () => {
    if (!config) return 0;
    let count = 0;
    if (config.is_paypal_enabled && config.paypal_email) count++;
    if (config.is_bank_enabled && (config.bank_name || config.bank_account)) count++;
    if (config.is_zelle_enabled && (config.zelle_email || config.zelle_phone)) count++;
    return count;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="container mx-auto px-4 py-8">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Volver al inicio</span>
          </Link>
          
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <Heart className="w-16 h-16 text-muted-foreground/30 mb-6" />
            <h1 className="text-3xl font-bold text-foreground mb-4">Donaciones no disponibles</h1>
            <p className="text-muted-foreground">Por favor, vuelve más tarde.</p>
          </div>
        </div>
      </div>
    );
  }

  const hasAnyMethod = config.is_paypal_enabled || config.is_bank_enabled || config.is_zelle_enabled;
  const enabledCount = getEnabledMethodsCount();

  // Dynamic grid classes based on number of enabled methods
  const getGridClasses = () => {
    if (enabledCount === 1) {
      return "flex justify-center";
    }
    if (enabledCount === 2) {
      return "grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto";
    }
    return "grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto";
  };

  // Card width for single card
  const getCardClasses = () => {
    if (enabledCount === 1) {
      return "w-full max-w-md";
    }
    return "";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      {/* Back Button and Header */}
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Volver al inicio</span>
        </Link>
      </div>

      {/* Hero Section - Compact */}
      <section className="pb-10 sm:pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20">
              <Heart className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground uppercase tracking-wide mb-4">
              {config.title}
            </h1>
            {config.subtitle && (
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                {config.subtitle}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="pb-16 sm:pb-24">
        <div className="container mx-auto px-4">
          {config.description && (
            <p className="text-center text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 sm:mb-12 leading-relaxed">
              {config.description}
            </p>
          )}

          {!hasAnyMethod ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No hay métodos de donación configurados actualmente.</p>
            </div>
          ) : (
            <div className={getGridClasses()}>
              {/* PayPal */}
              {config.is_paypal_enabled && config.paypal_email && (
                <Card className={`border-border/50 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-card/50 backdrop-blur-sm ${getCardClasses()}`}>
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                      <CreditCard className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl uppercase tracking-wide">PayPal</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center space-y-4 pt-0">
                    <p className="text-muted-foreground text-sm">Envía tu donación a:</p>
                    <p className="font-semibold text-foreground break-all bg-muted/50 py-2 px-3 rounded-lg text-sm">
                      {config.paypal_email}
                    </p>
                    <Button 
                      className="w-full"
                      onClick={() => window.open(`https://paypal.me/${config.paypal_email}`, '_blank')}
                    >
                      Donar con PayPal
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Bank Transfer */}
              {config.is_bank_enabled && (config.bank_name || config.bank_account) && (
                <Card className={`border-border/50 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-card/50 backdrop-blur-sm ${getCardClasses()}`}>
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                      <Building2 className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl uppercase tracking-wide">Transferencia Bancaria</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    {config.bank_name && (
                      <div className="bg-muted/50 py-3 px-4 rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Banco</p>
                        <p className="font-semibold text-foreground">{config.bank_name}</p>
                      </div>
                    )}
                    {config.bank_holder && (
                      <div className="bg-muted/50 py-3 px-4 rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Titular</p>
                        <p className="font-semibold text-foreground">{config.bank_holder}</p>
                      </div>
                    )}
                    {config.bank_account && (
                      <div className="bg-muted/50 py-3 px-4 rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Número de Cuenta</p>
                        <p className="font-semibold text-foreground break-all text-sm">{config.bank_account}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Zelle */}
              {config.is_zelle_enabled && (config.zelle_email || config.zelle_phone) && (
                <Card className={`border-border/50 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-card/50 backdrop-blur-sm ${getCardClasses()}`}>
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                      <Smartphone className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl uppercase tracking-wide">Zelle</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    {config.zelle_email && (
                      <div className="bg-muted/50 py-3 px-4 rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Email</p>
                        <p className="font-semibold text-foreground break-all text-sm">{config.zelle_email}</p>
                      </div>
                    )}
                    {config.zelle_phone && (
                      <div className="bg-muted/50 py-3 px-4 rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Teléfono</p>
                        <p className="font-semibold text-foreground">{config.zelle_phone}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Donations;
