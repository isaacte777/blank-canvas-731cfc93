import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Calendar, MapPin, ArrowRight, Edit3 } from "lucide-react";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { useState } from "react";

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  location: string | null;
  image_url?: string | null;
  is_visible: boolean;
}

interface EventsProps {
  events?: Event[];
  isEditable?: boolean;
  onEditEvent?: (event: Event) => void;
}

export const Events = ({ events: propEvents, isEditable = false, onEditEvent }: EventsProps) => {
  const { ref, isVisible } = useScrollAnimation();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  // Eventos por defecto si no hay datos de la base de datos
  const defaultEvents = [
    {
      id: '1',
      title: "Retiro Espiritual de Primavera",
      event_date: "2025-03-15",
      event_time: "08:00",
      location: "Centro de Retiros Valle de Paz",
      description: "Tres días de renovación espiritual, enseñanzas profundas y comunión.",
      image_url: null,
      is_visible: true
    },
    {
      id: '2',
      title: "Conferencia de Jóvenes",
      event_date: "2025-03-22",
      event_time: "18:00",
      location: "Auditorio Principal",
      description: "Un evento especial para jóvenes con música en vivo y oradores inspiradores.",
      image_url: null,
      is_visible: true
    },
    {
      id: '3',
      title: "Noche de Alabanza",
      event_date: "2025-03-29",
      event_time: "19:00",
      location: "Santuario de la Iglesia",
      description: "Una noche dedicada a la adoración y la presencia de Dios.",
      image_url: null,
      is_visible: true
    }
  ];

  const events = propEvents && propEvents.length > 0 ? propEvents : defaultEvents;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <section className="py-12 md:py-20 lg:py-24 bg-background" ref={ref}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-16">
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-heading text-foreground mb-3 md:mb-4 tracking-wider uppercase">
            <span className="text-pink">ANUNCIOS</span>
          </h2>
          <p className="text-base md:text-lg lg:text-xl text-turquoise-light font-body font-semibold">
            Únete a nosotros en estas celebraciones especiales
          </p>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No hay eventos próximos</p>
          </div>
        ) : (
          <div className={`grid gap-4 md:gap-6 lg:gap-8 max-w-7xl mx-auto ${
            events.length === 1 
              ? 'grid-cols-1 max-w-md' 
              : events.length === 2 
                ? 'grid-cols-1 sm:grid-cols-2 max-w-3xl' 
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}>
            {events.map((event, index) => (
              <Card 
                key={event.id}
                className="group h-full bg-card/50 backdrop-blur-sm border border-border/50 hover:border-turquoise/60 rounded-2xl overflow-hidden hover:-translate-y-2 hover:shadow-[0_20px_50px_-15px_hsl(var(--turquoise)/0.2)] transition-transform duration-300 flex flex-col"
              >
                <CardContent className="p-0 h-full flex flex-col relative">
                  {/* Edit Button for Admin */}
                  {isEditable && onEditEvent && (
                    <button
                      onClick={() => onEditEvent(event)}
                      className="absolute top-2 right-2 z-10 p-2 bg-pink/90 hover:bg-pink text-background rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg"
                      title="Editar evento"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}

                  {/* Event Image - Only shown if image_url exists */}
                  {event.image_url && (
                    <div className="relative h-40 overflow-hidden">
                      <img 
                        src={event.image_url} 
                        alt={event.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                    </div>
                  )}
                  
                  {/* Date Badge Header */}
                  <div className="relative bg-gradient-to-r from-turquoise/10 to-pink/10 px-5 py-4 border-b border-border/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-turquoise/20 rounded-xl border border-turquoise/30 group-hover:bg-turquoise/30 transition-colors">
                          <Calendar className="w-4 h-4 text-turquoise" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider" style={{ fontFamily: 'var(--font-hero)' }}>
                            Fecha
                          </p>
                          <p className="text-sm font-semibold text-foreground" style={{ fontFamily: 'var(--font-hero)' }}>
                            {formatDate(event.event_date)}
                          </p>
                        </div>
                      </div>
                      {event.event_time && (
                        <span className="text-xs font-medium text-turquoise bg-turquoise/10 px-2.5 py-1 rounded-full border border-turquoise/20">
                          {formatTime(event.event_time)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content Body */}
                  <div className="flex-1 p-5 flex flex-col">
                    <h3 
                      className="text-lg md:text-xl font-bold text-foreground leading-tight mb-3 line-clamp-2 min-h-[3.5rem]"
                      style={{ fontFamily: 'var(--font-hero)' }}
                    >
                      {event.title}
                    </h3>
                    
                    {event.location && (
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="w-3.5 h-3.5 text-pink shrink-0" />
                        <span className="text-xs text-muted-foreground line-clamp-1">{event.location}</span>
                      </div>
                    )}

                    {event.description && (
                      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 flex-1 min-h-[4rem]">
                        {event.description}
                      </p>
                    )}

                    {/* Spacer to push button to bottom */}
                    <div className="flex-1" />

                    {/* Action Button */}
                    <Button 
                      variant="ghost" 
                      className="w-full mt-4 h-11 bg-foreground/5 hover:bg-turquoise text-foreground/70 hover:text-background border border-border/50 hover:border-turquoise rounded-xl transition-all duration-300 font-medium text-sm uppercase tracking-wider group/btn"
                      style={{ fontFamily: 'var(--font-hero)' }}
                      onClick={() => setSelectedEvent(event)}
                    >
                      Más Info
                      <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={selectedEvent !== null} onOpenChange={(open) => !open && setSelectedEvent(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-md md:max-w-xl lg:max-w-2xl border-2 border-turquoise/40">
            {selectedEvent && (
              <>
                {/* Event Image in Modal */}
                {selectedEvent.image_url && (
                  <div className="relative h-48 md:h-64 -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-lg">
                    <img 
                      src={selectedEvent.image_url} 
                      alt={selectedEvent.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  </div>
                )}
                
                <DialogHeader>
                  <DialogTitle className="text-2xl sm:text-3xl md:text-4xl font-display text-foreground tracking-wide">
                    {selectedEvent.title}
                  </DialogTitle>
                  <DialogDescription className="text-sm md:text-base lg:text-lg text-muted-foreground font-body mt-3 md:mt-4">
                    {selectedEvent.description}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-3 md:space-y-4 mt-4 md:mt-6">
                  <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-turquoise/10 rounded-lg border border-turquoise/30">
                    <div className="p-2 md:p-3 bg-turquoise/20 rounded-lg">
                      <Calendar className="w-5 h-5 md:w-6 md:h-6 text-turquoise" />
                    </div>
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground font-body">Fecha</p>
                      <p className="text-base md:text-lg font-heading text-foreground">
                        {formatDate(selectedEvent.event_date)}
                        {selectedEvent.event_time && ` - ${formatTime(selectedEvent.event_time)}`}
                      </p>
                    </div>
                  </div>
                  
                  {selectedEvent.location && (
                    <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-pink/10 rounded-lg border border-pink/30">
                      <div className="p-2 md:p-3 bg-pink/20 rounded-lg">
                        <MapPin className="w-5 h-5 md:w-6 md:h-6 text-pink" />
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground font-body">Ubicación</p>
                        <p className="text-base md:text-lg font-heading text-foreground">{selectedEvent.location}</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};
