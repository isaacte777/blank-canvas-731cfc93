import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Users, Music, Heart, BookOpen, Church, Baby, GraduationCap, Flame, ArrowRight, Edit3, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';

export interface Ministry {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  icon: string | null;
  is_visible: boolean;
  display_order: number;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  Music,
  Heart,
  BookOpen,
  Church,
  Baby,
  GraduationCap,
  Flame
};

interface MinistriesProps {
  ministries: Ministry[];
  isEditable?: boolean;
  onEditMinistry?: (ministry: Ministry) => void;
  onAddMinistry?: () => void;
}

/** Copies of the list rendered in the strip: 3 cycles enable seamless infinite wrap. */
const COPIES = 3;

// True visual cycle: one FULL copy of the list = N cards + N gaps.
// (scrollWidth/3 drifts by gap/3 because the strip has no trailing gap,
// and a single card+gap is far narrower than the viewport, which disabled wrap.)
const getCycle = (el: HTMLDivElement): number => {
  const gap = parseFloat(getComputedStyle(el).columnGap || '0') || 0;
  const first = el.firstElementChild as HTMLElement | null;
  if (first && first.offsetWidth > 0) {
    const n = Math.max(1, Math.round(el.children.length / COPIES));
    return n * (first.offsetWidth + gap);
  }
  return el.scrollWidth / COPIES;
};

// Keep the viewport inside [cycle, 2*cycle) so the strip looks endless in
// BOTH directions. We deliberately do NOT wait for scrollLeft to reach `max`:
// fractional scroll positions can fall ~1px short of the computed maximum and
// stall the reverse direction. Returns the ACTUAL shift applied.
const applyWrap = (el: HTMLDivElement): number => {
  const cycle = getCycle(el);
  const vw = el.clientWidth;
  const max = el.scrollWidth - vw;
  // Room for a full cycle + safety margin (fractional rounding)
  if (cycle <= vw || max < 2 * cycle + 4) return 0;
  if (el.scrollLeft < cycle) {
    const before = el.scrollLeft;
    el.scrollLeft = before + cycle;
    return el.scrollLeft - before;
  }
  if (el.scrollLeft >= 2 * cycle) {
    const before = el.scrollLeft;
    el.scrollLeft = before - cycle;
    return el.scrollLeft - before;
  }
  return 0;
};

export const Ministries = ({ ministries, isEditable = false, onEditMinistry, onAddMinistry }: MinistriesProps) => {
  const { ref, isVisible } = useScrollAnimation();

  // ── Infinite slider: click + drag anywhere, fluid inertia, free stop ──
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ active: false, startX: 0, startScroll: 0, moved: false });
  const velRef = useRef(0); // px/ms of scrollLeft
  const lastMoveRef = useRef({ t: 0, dx: 0 });
  const inertiaRafRef = useRef(0);

  const stopInertia = () => {
    if (inertiaRafRef.current) cancelAnimationFrame(inertiaRafRef.current);
    inertiaRafRef.current = 0;
    velRef.current = 0;
  };

  // Position at the start of the middle cycle after mount / list size change
  const count = ministries?.length ?? 0;
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const cycle = getCycle(el);
    const max = el.scrollWidth - el.clientWidth;
    // Start at the beginning of the wrap window [cycle, 2*cycle) when possible
    el.scrollLeft = cycle > el.clientWidth && max >= 2 * cycle + 4 ? cycle : 0;
    const onResize = () => applyWrap(el);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (inertiaRafRef.current) cancelAnimationFrame(inertiaRafRef.current);
    };
  }, [count]);

  // Mouse drag: 1:1 follow, then glide with friction (fluid, stops on its own;
  // grab again at any moment to take control — "se detenga cuando yo quiere")
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return; // touch keeps native scrolling
    const el = scrollRef.current;
    if (!el) return;
    stopInertia();
    dragState.current = { active: true, startX: e.clientX, startScroll: el.scrollLeft, moved: false };
    velRef.current = 0;
    lastMoveRef.current = { t: performance.now(), dx: 0 };
    el.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!dragState.current.active || !el) return;
    const dx = e.clientX - dragState.current.startX;
    if (Math.abs(dx) > 5) dragState.current.moved = true;
    el.scrollLeft = dragState.current.startScroll - dx;
    // If the strip wrapped during this move, shift the origin too so the
    // 1:1 mapping stays continuous (no jump back on the next move)
    const shift = applyWrap(el);
    if (shift) dragState.current.startScroll += shift;
    // velocity from dx (immune to wrap jumps), exponential moving average
    const now = performance.now();
    const prev = lastMoveRef.current;
    const dt = now - prev.t;
    if (dt > 0) {
      const v = -(dx - prev.dx) / dt;
      velRef.current = velRef.current * 0.65 + v * 0.35;
    }
    lastMoveRef.current = { t: now, dx };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    dragState.current.active = false;
    try {
      el?.releasePointerCapture(e.pointerId);
    } catch {
      /* pointer already released */
    }
    if (!el || !dragState.current.moved) {
      velRef.current = 0;
      return;
    }
    // Inertial glide after release
    let vel = velRef.current;
    const step = () => {
      const node = scrollRef.current;
      if (!node) return;
      vel *= 0.94; // friction per frame ≈ stops in ~1s
      if (Math.abs(vel) < 0.15) {
        velRef.current = 0;
        inertiaRafRef.current = 0;
        return;
      }
      node.scrollLeft += vel * 16;
      applyWrap(node);
      inertiaRafRef.current = requestAnimationFrame(step);
    };
    if (Math.abs(vel) > 0.05) {
      inertiaRafRef.current = requestAnimationFrame(step);
    }
  };

  // Native scrolling (touch, momentum) also wraps
  const handleScroll = () => {
    const el = scrollRef.current;
    if (el) applyWrap(el);
  };

  // Prevent navigation when the user was dragging instead of clicking
  const handleClickCapture = (e: React.MouseEvent) => {
    if (dragState.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      dragState.current.moved = false;
    }
  };

  // Don't render if no ministries
  if (!ministries || ministries.length === 0) {
    return null;
  }

  return (
    <section className="relative py-12 sm:py-16 md:py-20 bg-background" ref={ref}>
      {/* Overlay for adding ministries (admin preview only) */}
      {isEditable && onAddMinistry && (
        <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-20">
          <Button
            size="sm"
            onClick={onAddMinistry}
            className="bg-turquoise hover:bg-turquoise/80 text-[10px] sm:text-sm h-7 sm:h-9 px-2 sm:px-3"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" /> <span className="hidden xs:inline ml-1">Agregar</span>
          </Button>
        </div>
      )}
      <div className="container mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className={`text-center mb-8 sm:mb-10 md:mb-14 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display text-foreground tracking-wide uppercase font-bold">
            Nuestros <span className="text-primary">Ministerios</span>
          </h2>
          <div className="w-16 h-1 bg-primary mx-auto mt-3 sm:mt-4 rounded-full" />
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground mt-3 sm:mt-4 max-w-2xl mx-auto">
            Conoce las diferentes áreas donde servimos y crece junto a nosotros
          </p>
        </div>

        {/* Infinite single lane: click + drag to slide endlessly */}
        <div className={`relative transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div
            ref={scrollRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onScroll={handleScroll}
            onClickCapture={handleClickCapture}
            onDragStart={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
            className="flex gap-4 sm:gap-5 md:gap-6 overflow-x-auto no-scrollbar pt-1 pb-1 select-none cursor-grab active:cursor-grabbing"
          >
            {Array.from({ length: COPIES }, (_, copyIdx) =>
              ministries.map((ministry) => {
                const Icon = iconMap[ministry.icon || 'Users'] || Users;
                const isMiddle = copyIdx === 1;

                return (
                <Link
                  key={`${copyIdx}-${ministry.id}`}
                  to={`/ministerios/${ministry.slug}`}
                  aria-hidden={!isMiddle}
                  tabIndex={isMiddle ? undefined : -1}
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  onClick={isEditable && onEditMinistry ? (e) => {
                    // Admin preview: click opens the editor instead of navigating
                    e.preventDefault();
                    e.stopPropagation();
                    onEditMinistry(ministry);
                  } : undefined}
                  className={`group relative block flex-none w-[78vw] sm:w-[320px] lg:w-[340px] xl:w-[360px] aspect-[9/16] overflow-hidden rounded-none bg-gradient-to-br from-muted via-background to-muted transition-all duration-500 focus:outline-none focus-visible:outline-none ${isEditable ? 'cursor-pointer' : ''}`}
                >
                  {/* Edit affordance (admin preview only) */}
                  {isEditable && onEditMinistry && (
                    <button
                      type="button"
                      title="Editar ministerio"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onEditMinistry(ministry);
                      }}
                      className="absolute top-2 right-2 z-10 p-2 bg-foreground/90 hover:bg-foreground text-background rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                  {/* Full-bleed media: the image covers the whole portrait rectangle */}
                    {ministry.image_url ? (
                      <img
                        src={ministry.image_url}
                        alt={ministry.title}
                        draggable={false}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Icon
                          className="w-16 h-16 sm:w-20 sm:h-20 text-foreground/40 group-hover:text-foreground/60 transition-all duration-700 ease-out group-hover:scale-105"
                          strokeWidth={1}
                        />
                      </div>
                    )}

                    {/* Gradient for text readability — no borders, no frame */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Bottom content: simple clear title + clear "Más información" button */}
                    <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                      <h3 className="text-white font-bold uppercase tracking-wide text-lg sm:text-xl leading-snug">
                        {ministry.title}
                      </h3>
                      <span className="mt-3 sm:mt-4 inline-flex items-center gap-2 rounded-full bg-white text-black px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-300 group-hover:bg-white/90 group-hover:-translate-y-0.5">
                        Más información
                        <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
