import { Quote } from "lucide-react";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { EditableWrapper } from "@/components/admin/EditableWrapper";

interface QuoteSectionProps {
  imageUrl?: string;
  quote?: string;
  author?: string;
  isEditable?: boolean;
  onEdit?: () => void;
}

export const QuoteSection = ({
  imageUrl = "",
  quote = "",
  author = "",
  isEditable = false,
  onEdit
}: QuoteSectionProps) => {
  const { ref, isVisible } = useScrollAnimation();

  // Fallbacks so the section never renders blank
  const displayQuote = quote || "Dios quiere hacer algo en tu vida pero necesita que le escuches";
  const displayAuthor = author || "Pra. Bethany Abreu";

  const content = (
    <section 
      ref={ref}
      className="relative py-12 sm:py-16 md:py-20 bg-gradient-to-b from-background via-muted/40 to-background border-y border-border/40 overflow-hidden"
    >
        <div className="container mx-auto px-4 sm:px-6">
          <div className={`flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 lg:gap-16 max-w-5xl mx-auto transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            {/* Circular Image / Placeholder */}
            <div className="shrink-0 relative">
              {imageUrl ? (
                <div className="w-44 h-44 sm:w-52 sm:h-52 md:w-60 md:h-60 lg:w-72 lg:h-72 rounded-full overflow-hidden shadow-2xl border-4 border-primary/30">
                  <img 
                    src={imageUrl} 
                    alt={displayAuthor}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-44 h-44 sm:w-52 sm:h-52 md:w-60 md:h-60 lg:w-72 lg:h-72 rounded-full flex items-center justify-center bg-muted border-4 border-border/60 shadow-2xl">
                  <Quote className="w-16 h-16 sm:w-20 sm:h-20 text-foreground" strokeWidth={1.5} />
                </div>
              )}
              {/* Decorative ring */}
              <div className="absolute -inset-3 rounded-full border border-dashed border-border/50 pointer-events-none" />
            </div>

            {/* Quote Text */}
            <div className="text-center md:text-left max-w-xl">
              <blockquote 
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-foreground leading-relaxed mb-4 md:mb-6"
                style={{ 
                  fontFamily: "'Dancing Script', 'Brush Script MT', cursive",
                  fontStyle: 'italic'
                }}
              >
                &ldquo;{displayQuote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <span className="w-10 h-px bg-primary/60 shrink-0" aria-hidden="true" />
                <cite 
                  className="text-base sm:text-lg md:text-xl text-muted-foreground not-italic"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {displayAuthor}
                </cite>
              </div>
            </div>
          </div>
        </div>
      </section>
  );

  if (isEditable && onEdit) {
    return (
      <EditableWrapper onClick={onEdit} label="Editar Cita">
        {content}
      </EditableWrapper>
    );
  }

  return content;
};
