import { Facebook, Instagram, Youtube, Mail, Edit3 } from "lucide-react";
import { Link } from "react-router-dom";
import cfaLogoFooter from "@/assets/cfa-logo-footer.png";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";

export type FooterField = 
  | 'facebookUrl' 
  | 'instagramUrl' 
  | 'youtubeUrl' 
  | 'emailUrl';

interface Ministry {
  id: string;
  slug: string;
  title: string;
  is_visible: boolean;
}

interface FooterProps {
  isEditable?: boolean;
  onEditField?: (field: FooterField) => void;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  youtubeUrl?: string | null;
  emailUrl?: string | null;
  ministries?: Ministry[];
}

export const Footer = ({ 
  isEditable = false,
  onEditField,
  facebookUrl,
  instagramUrl,
  youtubeUrl,
  emailUrl,
  ministries = []
}: FooterProps) => {

  const socialLinks = [
    { 
      field: 'facebookUrl' as FooterField, 
      url: facebookUrl || '#', 
      icon: Facebook, 
      label: 'Facebook' 
    },
    { 
      field: 'instagramUrl' as FooterField, 
      url: instagramUrl || '#', 
      icon: Instagram, 
      label: 'Instagram' 
    },
    { 
      field: 'youtubeUrl' as FooterField, 
      url: youtubeUrl || '#', 
      icon: Youtube, 
      label: 'YouTube' 
    },
    { 
      field: 'emailUrl' as FooterField, 
      url: emailUrl || '#', 
      icon: Mail, 
      label: 'Email' 
    },
  ];

  // Filter visible ministries
  const visibleMinistries = ministries.filter(m => m.is_visible);
  const { ref, isVisible } = useScrollAnimation();

  return (
    <footer className="bg-background border-t border-border py-6 sm:py-8 md:py-10 lg:py-12" ref={ref}>
      <div className="container mx-auto px-4 md:px-6">
        <div className={`grid gap-6 md:gap-8 mb-6 md:mb-8 ${visibleMinistries.length > 0 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3'}`}>
          {/* Logo and description */}
          <div className="space-y-2 sm:space-y-3 md:space-y-4 col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <img 
                src={cfaLogoFooter} 
                alt="Centro Familia de Adoración" 
                className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 object-contain"
              />
              <div className="text-foreground font-bold uppercase tracking-tight text-xs sm:text-sm md:text-base leading-tight">
                CENTRO FAMILIA DE ADORACIÓN
              </div>
            </div>
            <p className="text-muted-foreground text-[10px] sm:text-xs md:text-sm">
              Una comunidad de fe donde todos son bienvenidos.
            </p>
          </div>

          {/* Enlaces */}
          <div>
            <h4 className="font-bold mb-2 sm:mb-3 md:mb-4 text-foreground uppercase tracking-wide text-[10px] sm:text-xs md:text-sm">Enlaces</h4>
            <ul className="space-y-1 sm:space-y-1.5 md:space-y-2 text-[10px] sm:text-xs md:text-sm">
              <li>
                <a href="#servicios" className="text-muted-foreground hover:text-mint transition-colors">
                  Servicios
                </a>
              </li>
              <li>
                <a href="#nosotros" className="text-muted-foreground hover:text-mint transition-colors">
                  Sobre Nosotros
                </a>
              </li>
              <li>
                <a href="#anuncios" className="text-muted-foreground hover:text-mint transition-colors">
                  Anuncios
                </a>
              </li>
              <li>
                <a href="#ministerios" className="text-muted-foreground hover:text-mint transition-colors">
                  Ministerios
                </a>
              </li>
              <li>
                <a href="#contacto" className="text-muted-foreground hover:text-mint transition-colors">
                  Contacto
                </a>
              </li>
            </ul>
          </div>

          {visibleMinistries.length > 0 && (
            <div>
              <h4 className="font-bold mb-2 sm:mb-3 md:mb-4 text-foreground uppercase tracking-wide text-[10px] sm:text-xs md:text-sm">Ministerios</h4>
              <ul className="space-y-1 sm:space-y-1.5 md:space-y-2 text-[10px] sm:text-xs md:text-sm">
                {visibleMinistries.slice(0, 5).map((ministry) => (
                  <li key={ministry.id}>
                    {isEditable ? (
                      <span className="text-muted-foreground cursor-default">{ministry.title}</span>
                    ) : (
                      <Link 
                        to={`/ministerios/${ministry.slug}`} 
                        className="text-muted-foreground hover:text-mint transition-colors"
                      >
                        {ministry.title}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Síguenos */}
          <div className={visibleMinistries.length > 0 ? "col-span-2 md:col-span-1" : ""}>
            <h4 className="font-bold mb-2 sm:mb-3 md:mb-4 text-foreground uppercase tracking-wide text-[10px] sm:text-xs md:text-sm">Síguenos</h4>
            <div className="flex gap-2 md:gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <div key={social.field} className="relative group/social">
                    <a 
                      href={isEditable ? undefined : social.url}
                      onClick={isEditable ? (e) => {
                        e.preventDefault();
                        onEditField?.(social.field);
                      } : undefined}
                      className={`p-2 md:p-2.5 rounded-lg bg-muted hover:bg-mint transition-all duration-300 group block ${isEditable ? 'cursor-pointer' : ''}`}
                      aria-label={social.label}
                      target={!isEditable && social.url !== '#' ? '_blank' : undefined}
                      rel={!isEditable && social.url !== '#' ? 'noopener noreferrer' : undefined}
                    >
                      <Icon className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground group-hover:text-background" />
                    </a>
                    {isEditable && (
                      <span className="absolute -top-1 -right-1 opacity-0 group-hover/social:opacity-100 transition-opacity bg-primary text-primary-foreground rounded-full p-1 z-10">
                        <Edit3 className="w-2 h-2" />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {isEditable && (
              <p className="text-[10px] text-muted-foreground mt-2">
                Haz clic en un icono para editar su URL
              </p>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-5 sm:pt-6 mt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            © {new Date().getFullYear()} Centro Familia de Adoración. Todos los derechos reservados.
          </p>
          {!isEditable && (
            <a 
              href="#inicio" 
              className="text-[10px] sm:text-xs text-muted-foreground hover:text-mint transition-colors uppercase tracking-wider font-semibold"
            >
              Volver arriba ↑
            </a>
          )}
        </div>

      </div>
    </footer>
  );
};
