import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Send, Edit3, Loader2, CheckCircle } from "lucide-react";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { sanitizeInput, sanitizeEmail, sanitizePhone } from "@/lib/security";

// Validation schema
const contactSchema = z.object({
  full_name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(100, "El nombre es muy largo"),
  email: z.string().trim().email("Correo electrónico inválido").max(255, "El correo es muy largo"),
  phone: z.string().trim().max(30, "El teléfono es muy largo").optional(),
  message: z.string().trim().min(10, "El mensaje debe tener al menos 10 caracteres").max(2000, "El mensaje es muy largo")
});

export type ContactField = 
  | 'title' 
  | 'subtitle' 
  | 'addressLabel' 
  | 'addressLine1' 
  | 'addressLine2' 
  | 'phoneLabel' 
  | 'phoneLine1' 
  | 'phoneLine2' 
  | 'emailLabel' 
  | 'emailLine1' 
  | 'emailLine2'
  | 'mapUrl';

interface ContactProps {
  title?: string | null;
  subtitle?: string | null;
  isEditable?: boolean;
  onEditField?: (field: ContactField) => void;
  addressLabel?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  phoneLabel?: string | null;
  phoneLine1?: string | null;
  phoneLine2?: string | null;
  emailLabel?: string | null;
  emailLine1?: string | null;
  emailLine2?: string | null;
  mapUrl?: string | null;
}

export const Contact = ({ 
  title, 
  subtitle,
  isEditable = false,
  onEditField,
  addressLabel,
  addressLine1,
  addressLine2,
  phoneLabel,
  phoneLine1,
  phoneLine2,
  emailLabel,
  emailLine1,
  emailLine2,
  mapUrl
}: ContactProps) => {
  const { ref, isVisible } = useScrollAnimation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validate form
    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }
    
    setSending(true);
    
    try {
      // Sanitize all inputs before storing
      const { error } = await supabase.from('contact_messages').insert({
        full_name: sanitizeInput(formData.full_name),
        email: sanitizeEmail(formData.email),
        phone: sanitizePhone(formData.phone) || null,
        message: sanitizeInput(formData.message)
      });
      
      if (error) throw error;
      
      setSent(true);
      setFormData({ full_name: '', email: '', phone: '', message: '' });
      toast({
        title: "¡Mensaje enviado!",
        description: "Nos pondremos en contacto contigo pronto."
      });
      
      // Reset sent state after 5 seconds
      setTimeout(() => setSent(false), 5000);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const EditableText = ({ children, field, className = "" }: { children: React.ReactNode; field: ContactField; className?: string }) => {
    if (!isEditable) return <>{children}</>;
    return (
      <span 
        className={`relative group/edit cursor-pointer ${className}`}
        onClick={(e) => {
          e.stopPropagation();
          onEditField?.(field);
        }}
      >
        {children}
        <span className="absolute -top-1 -right-1 opacity-0 group-hover/edit:opacity-100 transition-opacity bg-primary text-primary-foreground rounded-full p-1 z-10">
          <Edit3 className="w-3 h-3" />
        </span>
        <span className="absolute inset-0 border-2 border-dashed border-primary/50 rounded opacity-0 group-hover/edit:opacity-100 transition-opacity" />
      </span>
    );
  };
  
  return (
    <section className="py-10 sm:py-12 md:py-20 lg:py-24 bg-muted/30" ref={ref}>
      <div className="container mx-auto px-3 sm:px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10 md:mb-16">
          <h2 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-display text-foreground mb-2 sm:mb-3 md:mb-4 tracking-wide">
            <EditableText field="title">
              <span className="text-turquoise">{title || ''}</span>
            </EditableText>
          </h2>
          <EditableText field="subtitle">
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-turquoise-light font-body font-semibold">
              {subtitle || ''}
            </p>
          </EditableText>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 lg:gap-12 max-w-6xl mx-auto">
          <Card className="bg-card border-border">
            <CardContent className="p-4 sm:p-5 md:p-6 lg:p-8">
              {sent ? (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
                  <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-mint mb-3 sm:mb-4" />
                  <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1.5 sm:mb-2">¡Gracias por tu mensaje!</h3>
                  <p className="text-muted-foreground text-sm sm:text-base">Nos pondremos en contacto contigo pronto.</p>
                </div>
              ) : (
                <form className="space-y-3 sm:space-y-4 md:space-y-6" onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="name" className="block text-[10px] sm:text-xs md:text-sm font-semibold text-foreground mb-1.5 sm:mb-2 uppercase tracking-wide">
                      Nombre Completo *
                    </label>
                    <Input 
                      id="name"
                      placeholder="Tu nombre" 
                      className={`bg-background border-border text-foreground text-sm sm:text-base ${errors.full_name ? 'border-destructive' : ''}`}
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      disabled={sending}
                    />
                    {errors.full_name && <p className="text-destructive text-[10px] sm:text-xs mt-1">{errors.full_name}</p>}
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-[10px] sm:text-xs md:text-sm font-semibold text-foreground mb-1.5 sm:mb-2 uppercase tracking-wide">
                      Correo Electrónico *
                    </label>
                    <Input 
                      id="email"
                      type="email" 
                      placeholder="tu@email.com" 
                      className={`bg-background border-border text-foreground text-sm sm:text-base ${errors.email ? 'border-destructive' : ''}`}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={sending}
                    />
                    {errors.email && <p className="text-destructive text-[10px] sm:text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-[10px] sm:text-xs md:text-sm font-semibold text-foreground mb-1.5 sm:mb-2 uppercase tracking-wide">
                      Teléfono
                    </label>
                    <Input 
                      id="phone"
                      type="tel" 
                      placeholder="+595 981 234 567" 
                      className="bg-background border-border text-foreground text-sm sm:text-base"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={sending}
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-[10px] sm:text-xs md:text-sm font-semibold text-foreground mb-1.5 sm:mb-2 uppercase tracking-wide">
                      Mensaje *
                    </label>
                    <Textarea 
                      id="message"
                      placeholder="¿En qué podemos ayudarte?" 
                      className={`bg-background border-border text-foreground min-h-20 sm:min-h-24 md:min-h-32 text-sm sm:text-base ${errors.message ? 'border-destructive' : ''}`}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      disabled={sending}
                    />
                    {errors.message && <p className="text-destructive text-[10px] sm:text-xs mt-1">{errors.message}</p>}
                  </div>
                  <Button 
                    type="submit"
                    className="w-full bg-mint hover:bg-mint-dark text-background font-bold py-3 sm:py-4 md:py-5 lg:py-6 text-xs sm:text-sm md:text-base uppercase tracking-wide transition-all duration-300"
                    disabled={sending}
                  >
                    {sending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1.5 sm:mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        Enviar Mensaje
                        <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 ml-1.5 sm:ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <div className="space-y-3 sm:space-y-4 md:space-y-6">
            {/* Address Card */}
            <Card className="bg-card border-border hover:border-mint/50 transition-all duration-300 group">
              <CardContent className="p-3 sm:p-4 md:p-5 lg:p-6 flex items-start gap-2.5 sm:gap-3 md:gap-4">
                <div className="p-1.5 sm:p-2 md:p-3 rounded-lg bg-mint/10 group-hover:bg-mint/20 transition-colors flex-shrink-0">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-mint" />
                </div>
                <div className="min-w-0">
                  <EditableText field="addressLabel">
                    <h3 className="font-bold text-xs sm:text-sm md:text-base text-foreground mb-0.5 sm:mb-1 md:mb-2 uppercase tracking-wide">
                      {addressLabel || ''}
                    </h3>
                  </EditableText>
                  <p className="text-muted-foreground text-[10px] sm:text-xs md:text-sm break-words">
                    <EditableText field="addressLine1">
                      <span>{addressLine1 || ''}</span>
                    </EditableText>
                    <br />
                    <EditableText field="addressLine2">
                      <span>{addressLine2 || ''}</span>
                    </EditableText>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Phone Card */}
            <Card className="bg-card border-border hover:border-mint/50 transition-all duration-300 group">
              <CardContent className="p-3 sm:p-4 md:p-5 lg:p-6 flex items-start gap-2.5 sm:gap-3 md:gap-4">
                <div className="p-1.5 sm:p-2 md:p-3 rounded-lg bg-mint/10 group-hover:bg-mint/20 transition-colors flex-shrink-0">
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-mint" />
                </div>
                <div className="min-w-0">
                  <EditableText field="phoneLabel">
                    <h3 className="font-bold text-xs sm:text-sm md:text-base text-foreground mb-0.5 sm:mb-1 md:mb-2 uppercase tracking-wide">
                      {phoneLabel || ''}
                    </h3>
                  </EditableText>
                  <p className="text-muted-foreground text-[10px] sm:text-xs md:text-sm break-words">
                    <EditableText field="phoneLine1">
                      <span>{phoneLine1 || ''}</span>
                    </EditableText>
                    <br />
                    <EditableText field="phoneLine2">
                      <span>{phoneLine2 || ''}</span>
                    </EditableText>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Email Card */}
            <Card className="bg-card border-border hover:border-mint/50 transition-all duration-300 group">
              <CardContent className="p-3 sm:p-4 md:p-5 lg:p-6 flex items-start gap-2.5 sm:gap-3 md:gap-4">
                <div className="p-1.5 sm:p-2 md:p-3 rounded-lg bg-mint/10 group-hover:bg-mint/20 transition-colors flex-shrink-0">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-mint" />
                </div>
                <div className="min-w-0">
                  <EditableText field="emailLabel">
                    <h3 className="font-bold text-xs sm:text-sm md:text-base text-foreground mb-0.5 sm:mb-1 md:mb-2 uppercase tracking-wide">
                      {emailLabel || ''}
                    </h3>
                  </EditableText>
                  <p className="text-muted-foreground text-[10px] sm:text-xs md:text-sm break-words">
                    <EditableText field="emailLine1">
                      <span>{emailLine1 || ''}</span>
                    </EditableText>
                    <br />
                    <EditableText field="emailLine2">
                      <span>{emailLine2 || ''}</span>
                    </EditableText>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Map - only show if mapUrl exists */}
            {mapUrl && (
              <div className="pt-3 sm:pt-4 md:pt-6 relative group">
                <div className="relative overflow-hidden rounded-lg sm:rounded-xl border border-border h-36 sm:h-44 md:h-56 lg:h-64">
                  <iframe
                    title="Ubicación de la iglesia"
                    src={mapUrl}
                    className="w-full h-full border-0"
                    loading="lazy"
                  />
                  {isEditable && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditField?.('mapUrl');
                      }}
                      className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1.5 sm:p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:scale-110 transform duration-200"
                    >
                      <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
