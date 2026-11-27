import { Volume2, VolumeX } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { convertToYouTubeEmbedUrl } from "@/lib/youtubeHelper";
import { useIsMobile } from "@/hooks/use-mobile";

export interface HeroConfig {
  mainTitle: string;
  accentTitle: string;
  tagline1: string;
  tagline2: string;
  tagline3: string;
  saturdayLabel: string;
  saturdayTime: string;
  sundayLabel: string;
  sundayTime: string;
}

export interface HeroMedia {
  mediaType: 'video' | 'image' | 'video_file';
  videoUrl: string;
  imageUrl: string;
  videoFileUrl?: string;
  // Mobile-specific media
  mobileMediaType?: 'video' | 'image' | 'video_file';
  mobileVideoUrl?: string;
  mobileImageUrl?: string;
  mobileVideoFileUrl?: string;
}

export const defaultHeroConfig: HeroConfig = {
  mainTitle: 'bienvenidos',
  accentTitle: 'A CFA',
  tagline1: 'CREE.',
  tagline2: 'PERTENECE.',
  tagline3: 'TRANSFORMA.',
  saturdayLabel: 'SÁBADO',
  saturdayTime: '20:00 HS',
  sundayLabel: 'DOMINGO',
  sundayTime: '10:00 Y 19:00 HS'
};

export const defaultHeroMedia: HeroMedia = {
  mediaType: 'video_file',
  videoUrl: '',
  imageUrl: '',
  // Video de fondo histórico (bucket público del proyecto anterior)
  videoFileUrl: 'https://pcubjmgstfqdfpftkvuu.supabase.co/storage/v1/object/public/videos/hero/1768572972625-qx7joa.mp4',
  mobileMediaType: undefined,
  mobileVideoUrl: '',
  mobileImageUrl: '',
  mobileVideoFileUrl: ''
};

interface HeroProps {
  config?: HeroConfig;
  media?: HeroMedia;
}

// Extend window to include YouTube Player API
declare global {
  interface Window {
    YT: {
      Player: new (elementId: string, options: {
        events?: {
          onReady?: (event: { target: YTPlayer }) => void;
          onStateChange?: (event: { data: number }) => void;
        };
      }) => YTPlayer;
      PlayerState: {
        PLAYING: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YTPlayer {
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  playVideo: () => void;
}

export const Hero = ({ config, media }: HeroProps = {}) => {
  const [isMuted, setIsMuted] = useState(true);
  const [heroConfig, setHeroConfig] = useState<HeroConfig>(config || defaultHeroConfig);
  const [heroMedia, setHeroMedia] = useState<HeroMedia>(media || defaultHeroMedia);
  const [ytPlayerReady, setYtPlayerReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const ytPlayerRef = useRef<YTPlayer | null>(null);
  const isMobile = useIsMobile();

  // If config is passed as prop, use it (for admin preview)
  useEffect(() => {
    if (config) {
      setHeroConfig(config);
    }
  }, [config]);

  // If media is passed as prop, use it (for admin preview)
  useEffect(() => {
    if (media) {
      setHeroMedia(media);
    }
  }, [media]);

  // Only fetch from DB if no config/media props are provided
  useEffect(() => {
    if (!config || !media) {
      fetchHeroData();
    }
  }, [config, media]);

  const fetchHeroData = async () => {
    const { data } = await supabase
      .from('page_content')
      .select('content, video_url, image_url, media_type, video_file_url')
      .eq('section', 'hero')
      .maybeSingle();
    
    if (data) {
      // Parse config from content
      if (data.content && !config) {
        try {
          const parsed = JSON.parse(data.content);
          setHeroConfig({ ...defaultHeroConfig, ...parsed });
        } catch {
          // If not valid JSON, use defaults
        }
      }
      
      // Set media if not provided via props
      if (!media) {
        const dataAny = data as Record<string, unknown>;
        const dbVideoUrl = (dataAny.video_url as string) || '';
        const dbVideoFileUrl = (dataAny.video_file_url as string) || '';
        const dbImageUrl = (dataAny.image_url as string) || '';
        const wanted = (dataAny.media_type as 'video' | 'image' | 'video_file') || '';
        // Usa el tipo pedido solo si tiene contenido; si no, cae al video de respaldo
        let mediaType: 'video' | 'image' | 'video_file';
        if (wanted === 'video') mediaType = dbVideoUrl ? 'video' : defaultHeroMedia.mediaType;
        else if (wanted === 'video_file') mediaType = dbVideoFileUrl ? 'video_file' : defaultHeroMedia.mediaType;
        else if (wanted === 'image') mediaType = dbImageUrl ? 'image' : dbVideoUrl ? 'video' : dbVideoFileUrl ? 'video_file' : defaultHeroMedia.mediaType;
        else mediaType = dbVideoUrl ? 'video' : dbVideoFileUrl ? 'video_file' : dbImageUrl ? 'image' : defaultHeroMedia.mediaType;
        setHeroMedia({
          mediaType,
          videoUrl: dbVideoUrl,
          imageUrl: dbImageUrl,
          videoFileUrl: dbVideoFileUrl || defaultHeroMedia.videoFileUrl,
          mobileMediaType: (dataAny.mobile_media_type as 'video' | 'image' | 'video_file') || undefined,
          mobileVideoUrl: (dataAny.mobile_video_url as string) || '',
          mobileImageUrl: (dataAny.mobile_image_url as string) || '',
          mobileVideoFileUrl: (dataAny.mobile_video_file_url as string) || ''
        });
      }
    }
  };

  // Load YouTube IFrame API
  useEffect(() => {
    if (!document.getElementById('youtube-iframe-api')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  const onPlayerReady = useCallback((event: { target: YTPlayer }) => {
    ytPlayerRef.current = event.target;
    setYtPlayerReady(true);
    // Start muted
    event.target.mute();
  }, []);

  // Initialize YouTube player when iframe is ready
  useEffect(() => {
    const initPlayer = () => {
      if (window.YT && window.YT.Player && document.getElementById('hero-youtube-player')) {
        new window.YT.Player('hero-youtube-player', {
          events: {
            onReady: onPlayerReady
          }
        });
      }
    };

    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      // Wait for API to load
      window.onYouTubeIframeAPIReady = initPlayer;
    }
  }, [heroMedia.videoUrl, heroMedia.mobileVideoUrl, onPlayerReady]);

  useEffect(() => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(error => {
          console.log("Error al reproducir audio:", error);
        });
      }
    }
  }, [isMuted]);

  // Control YouTube player mute state
  useEffect(() => {
    if (ytPlayerRef.current && ytPlayerReady) {
      if (isMuted) {
        ytPlayerRef.current.mute();
      } else {
        ytPlayerRef.current.unMute();
      }
    }
  }, [isMuted, ytPlayerReady]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Determine which media to use based on device
  const hasMobileMedia = heroMedia.mobileMediaType && (
    (heroMedia.mobileMediaType === 'video' && heroMedia.mobileVideoUrl) ||
    (heroMedia.mobileMediaType === 'video_file' && heroMedia.mobileVideoFileUrl) ||
    (heroMedia.mobileMediaType === 'image' && heroMedia.mobileImageUrl)
  );

  const currentMediaType = (isMobile && hasMobileMedia) 
    ? heroMedia.mobileMediaType! 
    : heroMedia.mediaType;
  
  const currentVideoUrl = (isMobile && hasMobileMedia && heroMedia.mobileMediaType === 'video') 
    ? heroMedia.mobileVideoUrl! 
    : heroMedia.videoUrl;
  
  const currentVideoFileUrl = (isMobile && hasMobileMedia && heroMedia.mobileMediaType === 'video_file') 
    ? heroMedia.mobileVideoFileUrl! 
    : heroMedia.videoFileUrl;
  
  const currentImageUrl = (isMobile && hasMobileMedia && heroMedia.mobileMediaType === 'image') 
    ? heroMedia.mobileImageUrl! 
    : heroMedia.imageUrl;

  return (
    <section className="relative h-[100dvh] w-full overflow-hidden bg-background">
      {/* Audio de fondo */}
      <audio 
        ref={audioRef}
        loop
        className="hidden"
      >
      </audio>

      {/* Background Media - Video or Image */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
        {currentMediaType === 'video' && currentVideoUrl ? (
            (() => {
              const embedUrl = convertToYouTubeEmbedUrl(currentVideoUrl);
              const videoId = embedUrl.split('/').pop()?.split('?')[0] || '';
              return (
                <>
                  <iframe
                    id="hero-youtube-player"
                    className="w-full h-full min-w-[100%] min-h-[100%] object-cover pointer-events-none"
                    src={`${embedUrl}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&modestbranding=1&disablekb=1&fs=0&iv_load_policy=3&playsinline=1&enablejsapi=1&origin=${window.location.origin}`}
                    title="Video de Bienvenida"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    style={{ 
                      border: 0,
                      aspectRatio: '16/9',
                      width: '177.78vh',
                      height: '100vh',
                      minWidth: '100%',
                      minHeight: '100%',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      pointerEvents: 'none'
                    }}
                  />
                  {/* Invisible overlay to block all interactions */}
                  <div className="absolute inset-0 z-10" />
                </>
              );
            })()
          ) : currentMediaType === 'video_file' && currentVideoFileUrl ? (
            <video
              className="w-full h-full object-cover absolute inset-0 pointer-events-none"
              src={currentVideoFileUrl}
              autoPlay
              loop
              muted={isMuted}
              playsInline
            />
          ) : currentImageUrl ? (
            <img
              src={currentImageUrl}
              alt="Fondo del Hero"
              className="w-full h-full object-cover absolute inset-0 animate-kenburns"
            />
          ) : null}
        </div>
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />
        
        {/* Mute Button - Show for video and video_file */}
        {(currentMediaType === 'video' || currentMediaType === 'video_file') && (
          <button
            onClick={toggleMute}
            className="absolute bottom-5 left-4 sm:bottom-6 sm:left-6 z-50 p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-300 backdrop-blur-sm border border-white/20 cursor-pointer"
            aria-label={isMuted ? "Activar sonido" : "Silenciar"}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-white pointer-events-none" />
            ) : (
              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-white pointer-events-none" />
            )}
          </button>
        )}
      </div>
      
      {/* Content overlay - Centered elegant design */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4 sm:px-6">
        {/* Main content container */}
        <div className="text-center space-y-6 sm:space-y-8 md:space-y-10">
          {/* Main Title - Elegant serif typography */}
          <div className="space-y-1 sm:space-y-2 animate-fade-in">
            <h1 
              className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-wide uppercase"
            >
              {heroConfig.mainTitle}
            </h1>
            
            <h2 
              className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white tracking-[0.15em] sm:tracking-[0.2em] uppercase"
            >
              {heroConfig.accentTitle}
            </h2>
          </div>

          {/* Taglines - staggered reveal */}
          {(heroConfig.tagline1 || heroConfig.tagline2 || heroConfig.tagline3) && (
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 sm:gap-x-6 md:gap-x-8">
              {[
                { text: heroConfig.tagline1, className: 'animate-hero-tagline-1' },
                { text: heroConfig.tagline2, className: 'animate-hero-tagline-2' },
                { text: heroConfig.tagline3, className: 'animate-hero-tagline-3' },
              ].map((tagline, index) =>
                tagline.text ? (
                  <span
                    key={index}
                    className={`text-xs sm:text-sm md:text-base lg:text-lg font-bold tracking-[0.25em] sm:tracking-[0.35em] text-white/85 uppercase ${tagline.className}`}
                    style={{ fontFamily: 'var(--font-hero)' }}
                  >
                    {tagline.text}
                  </span>
                ) : null
              )}
            </div>
          )}

          {/* Service schedule - two ordered pills */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-4 animate-hero-schedule">
            <span
              className="inline-flex items-center justify-center px-5 sm:px-6 py-2 sm:py-2.5 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm text-base sm:text-lg md:text-xl text-white/95 tracking-wide"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic' }}
            >
              {heroConfig.saturdayLabel} {heroConfig.saturdayTime}
            </span>
            <span
              className="inline-flex items-center justify-center px-5 sm:px-6 py-2 sm:py-2.5 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm text-base sm:text-lg md:text-xl text-white/95 tracking-wide"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic' }}
            >
              {heroConfig.sundayLabel} {heroConfig.sundayTime}
            </span>
          </div>
        </div>
      </div>

      {/* Subtle gradient at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-24 sm:h-32 bg-gradient-to-t from-black/50 to-transparent pointer-events-none z-10" />
    </section>
  );
};