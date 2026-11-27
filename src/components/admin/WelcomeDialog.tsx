import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Palette, 
  Image, 
  FileText, 
  Calendar, 
  Users, 
  MessageSquare,
  Settings,
  Church
} from "lucide-react";

const STORAGE_KEY = "admin_welcome_dismissed";
const SESSION_KEY = "admin_welcome_shown_this_session";
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

export const WelcomeDialog = () => {
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) {
      return;
    }

    const dismissedData = localStorage.getItem(STORAGE_KEY);
    if (dismissedData) {
      const { timestamp } = JSON.parse(dismissedData);
      const now = Date.now();
      
      if (now - timestamp < ONE_MONTH_MS) {
        return;
      }
    }
    
    setOpen(true);
    sessionStorage.setItem(SESSION_KEY, "true");
  }, []);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ timestamp: Date.now() })
      );
    }
    setOpen(false);
  };

  const features = [
    {
      icon: Church,
      title: "Sección Hero",
      description: "Imagen principal y bienvenida"
    },
    {
      icon: FileText,
      title: "Acerca de",
      description: "Información de la iglesia"
    },
    {
      icon: Calendar,
      title: "Servicios",
      description: "Horarios y tipos de servicios"
    },
    {
      icon: MessageSquare,
      title: "Anuncios",
      description: "Comunicados importantes"
    },
    {
      icon: Users,
      title: "Ministerios",
      description: "Gestión de ministerios"
    },
    {
      icon: Image,
      title: "Galería",
      description: "Fotos y eventos"
    },
    {
      icon: Palette,
      title: "Colores",
      description: "Personalización visual"
    },
    {
      icon: Settings,
      title: "Administradores",
      description: "Control de accesos"
    }
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg border-border/50 bg-background/95 backdrop-blur-sm shadow-2xl">
        <DialogHeader className="space-y-3 pb-2">
          <DialogTitle className="text-xl font-semibold text-center tracking-tight">
            Panel de Administración
          </DialogTitle>
          <p className="text-sm text-muted-foreground text-center">
            Gestiona el contenido del sitio web
          </p>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 py-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-2.5 p-2.5 rounded-md border border-border/40 bg-muted/30 transition-colors hover:bg-muted/50"
            >
              <feature.icon className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <h4 className="font-medium text-sm leading-tight truncate">{feature.title}</h4>
                <p className="text-[11px] text-muted-foreground leading-tight truncate">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4 pt-2 border-t border-border/40">
          <div className="flex items-center justify-center gap-2">
            <Checkbox
              id="dontShowAgain"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked === true)}
              className="h-3.5 w-3.5"
            />
            <Label
              htmlFor="dontShowAgain"
              className="text-xs text-muted-foreground cursor-pointer"
            >
              No mostrar durante un mes
            </Label>
          </div>
          
          <Button 
            onClick={handleClose} 
            className="w-full"
            size="sm"
          >
            Entendido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
