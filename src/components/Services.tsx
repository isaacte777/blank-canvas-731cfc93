import { useState } from "react";
import { 
  Calendar, 
  Clock, 
  Users, 
  Church, 
  BookOpen, 
  Heart, 
  Edit3,
  Music,
  Baby,
  GraduationCap,
  Flame,
  Sun,
  Moon,
  Star,
  Crown,
  Cross,
  HandHeart,
  Handshake,
  Globe,
  Megaphone,
  Mic2,
  Radio,
  Tv,
  Camera,
  PenTool,
  Lightbulb,
  Coffee,
  Gift,
  PartyPopper,
  Sparkles,
  Umbrella,
  X,
  type LucideIcon
} from "lucide-react";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface Service {
  id: string;
  title: string;
  description: string | null;
  extended_content?: string | null;
  day: string | null;
  time: string | null;
  icon: string | null;
  is_visible: boolean;
  display_order: number;
}

interface ServicesProps {
  services?: Service[];
  onEditService?: (service: Service) => void;
  isEditable?: boolean;
}

// Extended icon map with 30 church/ministry related icons
const iconMap: Record<string, LucideIcon> = {
  Church,
  BookOpen,
  Users,
  Heart,
  Calendar,
  Clock,
  Music,
  Baby,
  GraduationCap,
  Flame,
  Sun,
  Moon,
  Star,
  Crown,
  Cross,
  HandHeart,
  Handshake,
  Globe,
  Megaphone,
  Mic2,
  Radio,
  Tv,
  Camera,
  PenTool,
  Lightbulb,
  Coffee,
  Gift,
  PartyPopper,
  Sparkles,
  Umbrella
};

export const Services = ({ services: propServices, onEditService, isEditable = false }: ServicesProps) => {
  const { ref, isVisible } = useScrollAnimation();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  
  const defaultServices: Service[] = [
    {
      id: '1',
      icon: 'Church',
      day: "Domingo",
      time: "10:00 AM",
      title: "Servicio Dominical",
      description: "Alabanza, adoración y mensaje de la Palabra de Dios para toda la familia",
      extended_content: "Un tiempo especial de comunión donde nos reunimos como familia de fe. Contamos con alabanza en vivo, oración colectiva y un mensaje inspirador para aplicar en tu vida diaria. Servicio de guardería disponible.",
      is_visible: true,
      display_order: 1
    },
    {
      id: '2',
      icon: 'BookOpen',
      day: "Miércoles",
      time: "7:00 PM",
      title: "Estudio Bíblico",
      description: "Profundizando en la Palabra de Dios y creciendo en fe",
      extended_content: "Estudio versículo por versículo de la Biblia. Un espacio para preguntas, discusión y crecimiento espiritual en comunidad. Todos los niveles de conocimiento bíblico son bienvenidos.",
      is_visible: true,
      display_order: 2
    },
    {
      id: '3',
      icon: 'Users',
      day: "Viernes",
      time: "7:30 PM",
      title: "Reunión de Jóvenes",
      description: "Comunidad, música y enseñanza para la juventud",
      extended_content: "Un ambiente dinámico y relevante para la juventud. Incluye juegos, adoración contemporánea, enseñanza práctica y oportunidades de servicio. Para jóvenes de 13 a 25 años.",
      is_visible: true,
      display_order: 3
    },
    {
      id: '4',
      icon: 'Heart',
      day: "Sábado",
      time: "5:00 PM",
      title: "Grupos de Vida",
      description: "Células familiares para crecer juntos en comunidad",
      extended_content: "Reuniones en hogares donde compartimos, oramos y estudiamos la Palabra en un ambiente íntimo y familiar. Un lugar para hacer amigos y crecer espiritualmente.",
      is_visible: true,
      display_order: 4
    }
  ];

  const services = propServices && propServices.length > 0 ? propServices : defaultServices;

  const handleMoreInfo = (e: React.MouseEvent, service: Service) => {
    e.stopPropagation();
    if (!isEditable) {
      setSelectedService(service);
    }
  };

  return (
    <>
      <section className="py-10 sm:py-12 md:py-20 lg:py-24 bg-muted/30" ref={ref}>
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          {/* Header consistente con About section */}
          <div className="text-center mb-8 sm:mb-10 md:mb-14">
            <h2 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display text-foreground tracking-wide uppercase font-bold">
              Nuestros{' '}
              <span className="text-primary">Servicios</span>
            </h2>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground mt-3 sm:mt-4 max-w-2xl mx-auto">
              Te invitamos a ser parte de nuestra comunidad de fe
            </p>
          </div>

          {/* Grid de servicios - estilo minimalista */}
          <div className={`grid gap-4 sm:gap-6 md:gap-8 mx-auto max-w-6xl ${
            services.length === 1 
              ? 'grid-cols-1 max-w-md' 
              : services.length === 2 
                ? 'grid-cols-1 sm:grid-cols-2 max-w-3xl' 
                : services.length === 3 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
          }`}>
            {services.map((service, index) => {
              const Icon = iconMap[service.icon || 'BookOpen'] || BookOpen;
              
              return (
                <div 
                  key={service.id} 
                  className="relative group/service h-full"
                >
                  {/* Botón de edición */}
                  {isEditable && onEditService && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover/service:opacity-100 transition-all duration-300">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditService(service);
                        }}
                        className="bg-card/95 backdrop-blur-sm border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs h-7 px-3 shadow-xl"
                      >
                        <Edit3 className="w-3 h-3 mr-1.5" /> Editar
                      </Button>
                    </div>
                  )}
                  
                  {/* Card minimalista con borde sutil */}
                  <div 
                    className={`h-full bg-card border border-border/50 rounded-2xl p-6 sm:p-8 flex flex-col transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:border-primary/30 ${isEditable ? 'cursor-pointer' : ''}`}
                    onClick={isEditable && onEditService ? () => onEditService(service) : undefined}
                  >
                    {/* Icono con fondo */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 sm:mb-6 transform group-hover/service:rotate-6 transition-transform border border-primary/20">
                      <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-primary" strokeWidth={1.5} />
                    </div>

                    {/* Título */}
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2 sm:mb-3 uppercase tracking-wide">
                      {service.title}
                    </h3>

                    {/* Horario destacado */}
                    {(service.day || service.time) && (
                      <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-primary">
                          {service.day}{service.day && service.time && ' • '}{service.time}
                        </span>
                      </div>
                    )}

                    {/* Descripción */}
                    <p className="text-muted-foreground text-sm sm:text-base leading-relaxed flex-grow mb-5 sm:mb-6">
                      {service.description}
                    </p>

                    {/* Link "Más Información" */}
                    <button 
                      onClick={(e) => handleMoreInfo(e, service)}
                      className="text-sm font-bold text-foreground hover:text-primary transition-colors cursor-pointer uppercase tracking-wider flex items-center gap-2 group/btn"
                    >
                      Más Información
                      <span className="w-0 group-hover/btn:w-4 overflow-hidden transition-all duration-300">→</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Modal de detalles del servicio */}
      <Dialog open={!!selectedService} onOpenChange={(open) => !open && setSelectedService(null)}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl md:text-2xl">
              {selectedService && (
                <>
                  {(() => {
                    const Icon = iconMap[selectedService.icon || 'BookOpen'] || BookOpen;
                    return <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />;
                  })()}
                  <span className="line-clamp-2">{selectedService.title}</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedService && (
            <div className="space-y-4 sm:space-y-6 pt-2 sm:pt-4">
              {/* Horario destacado */}
              {(selectedService.day || selectedService.time) && (
                <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-primary/10 rounded-lg sm:rounded-xl">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground text-sm sm:text-base">
                      {selectedService.day}
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-primary">
                      {selectedService.time}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Contenido detallado */}
              <div>
                <h4 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1.5 sm:mb-2">
                  Acerca de este servicio
                </h4>
                <p className="text-foreground leading-relaxed text-sm sm:text-base">
                  {selectedService.extended_content || selectedService.description}
                </p>
              </div>
              
              {/* Call to action */}
              <div className="pt-3 sm:pt-4 border-t border-border">
                <p className="text-xs sm:text-sm text-muted-foreground text-center">
                  ¡Te esperamos! Ven y únete a nuestra comunidad de fe.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};