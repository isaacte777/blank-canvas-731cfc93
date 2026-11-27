import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Users, Music, Heart, BookOpen, Church, Calendar, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Ministry {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string | null;
  image_url: string | null;
  icon: string | null;
  schedule: string | null;
  leader: string | null;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  Music,
  Heart,
  BookOpen,
  Church,
  Calendar,
  Clock
};

const MinistryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [ministry, setMinistry] = useState<Ministry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchMinistry();
    }
  }, [slug]);

  const fetchMinistry = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ministries')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching ministry:', error);
    }
    
    if (data) {
      setMinistry(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ministry) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Ministerio no encontrado</h1>
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inicio
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const Icon = iconMap[ministry.icon || 'Users'] || Users;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Image Section */}
      <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
        {ministry.image_url ? (
          <img 
            src={ministry.image_url} 
            alt={ministry.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 via-background to-accent/20" />
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        {/* Back button */}
        <div className="absolute top-4 left-4 z-10">
          <Link to="/" className="inline-flex items-center text-foreground/80 hover:text-foreground transition-colors bg-background/50 backdrop-blur-sm px-3 py-2 rounded-lg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </div>
        
        {/* Title overlay on image */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="container mx-auto">
            <div className="flex items-center gap-4 animate-section-title">
              <div className="p-3 md:p-4 rounded-2xl bg-mint/20 backdrop-blur-sm">
                <Icon className="h-8 w-8 md:h-12 md:w-12 text-mint" />
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-bold text-foreground font-hero">
                  {ministry.title}
                </h1>
                <p className="text-base md:text-lg text-muted-foreground mt-2">
                  {ministry.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-6 animate-section-subtitle">
            {ministry.content?.split('\n').map((paragraph, index) => (
              <p key={index} className="text-lg text-muted-foreground leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Info Cards */}
          <div className="grid md:grid-cols-2 gap-6 mt-12 animate-card-wow">
            <div className="p-6 rounded-2xl bg-muted/50 border border-border">
              <h3 className="font-bold text-foreground mb-2">Horario</h3>
              <p className="text-muted-foreground">{ministry.schedule || 'Por definir'}</p>
            </div>
            <div className="p-6 rounded-2xl bg-muted/50 border border-border">
              <h3 className="font-bold text-foreground mb-2">Liderazgo</h3>
              <p className="text-muted-foreground">{ministry.leader || 'Por asignar'}</p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 text-center animate-scale-bounce">
            <p className="text-muted-foreground mb-4">¿Te gustaría ser parte de este ministerio?</p>
            <Link to="/#contacto">
              <Button size="lg" className="bg-mint hover:bg-mint/90 text-background">
                Contáctanos
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinistryPage;
