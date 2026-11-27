import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { Button } from "@/components/ui/button";
import { EditableWrapper } from "@/components/admin/EditableWrapper";
import { Clock } from "lucide-react";

interface PrayerBannerProps {
  title?: string;
  subtitle?: string;
  schedule?: string;
  time?: string;
  buttonText?: string;
  buttonUrl?: string;
  backgroundImage?: string;
  isEditable?: boolean;
  onEdit?: () => void;
}

export const PrayerBanner = ({
  title = "",
  subtitle = "",
  schedule = "",
  time = "",
  buttonText = "",
  buttonUrl = "#contacto",
  backgroundImage,
  isEditable = false,
  onEdit
}: PrayerBannerProps) => {
  const { ref, isVisible } = useScrollAnimation();

  // Fallbacks so the banner never renders blank if content is missing
  const displayTitle = title || "ORACIÓN";
  const displaySubtitle = subtitle || "CONGREGACIONAL";
  const displaySchedule = schedule || "Lunes a Viernes";
  const displayTime = time || "05:30 hs";
  const displayButtonText = buttonText || "PARTICIPAR";
  const displayButtonUrl = buttonUrl || "#contacto";

  const backgroundStyle = backgroundImage 
    ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-foreground) / 0.12) 50%, hsl(var(--primary)) 100%)',
      };

  const content = (
    <section 
      ref={ref}
      className="relative py-12 sm:py-16 md:py-20 overflow-hidden"
      style={backgroundStyle}
    >
      {/* Decorative pattern overlay - only show if no background image */}
      {!backgroundImage && (
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      )}
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10">
          {/* Left side - Text content */}
          <div className="text-center md:text-left">
            <h2 
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-wider uppercase mb-1"
              style={{ fontFamily: 'var(--font-hero)' }}
            >
              {displayTitle}
            </h2>
            <p 
              className="text-lg sm:text-xl md:text-2xl text-white/90 tracking-[0.2em] uppercase mb-4"
              style={{ fontFamily: 'var(--font-hero)' }}
            >
              {displaySubtitle}
            </p>
            {/* Schedule chip */}
            <div className="inline-flex items-center justify-center gap-2.5 px-4 sm:px-5 py-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm">
              <Clock className="w-4 h-4 text-white/90 shrink-0" />
              <span className="text-sm sm:text-base text-white/90">{displaySchedule}</span>
              <span className="text-primary-foreground font-bold text-base sm:text-lg">{displayTime}</span>
            </div>
          </div>

          {/* Right side - Button */}
          <div className="shrink-0">
            <Button 
              variant="outline"
              size="lg"
              className="border-2 border-white text-white hover:bg-white hover:text-primary bg-transparent font-bold text-sm sm:text-base tracking-widest uppercase px-8 sm:px-12 py-6 rounded-md transition-all duration-300"
              style={{ fontFamily: 'var(--font-hero)' }}
              asChild
            >
              {displayButtonUrl.startsWith('http') ? (
                <a href={displayButtonUrl} target="_blank" rel="noopener noreferrer">{displayButtonText}</a>
              ) : (
                <a href={displayButtonUrl}>{displayButtonText}</a>
              )}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );

  if (isEditable && onEdit) {
    return (
      <EditableWrapper onClick={onEdit} label="Editar Oración">
        {content}
      </EditableWrapper>
    );
  }

  return content;
};
