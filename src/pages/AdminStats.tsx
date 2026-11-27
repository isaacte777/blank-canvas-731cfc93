import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  ArrowLeft, 
  Users, 
  Eye, 
  FileText, 
  Calendar, 
  Smartphone, 
  Monitor,
  BarChart3,
  RefreshCw,
  AlertCircle,
  Layers,
  Clock,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type TimeFilter = 'today' | 'week' | 'month';

interface PageStat {
  page_path: string;
  page_name: string;
  visits: number;
  percentage: number;
  avgTimeSpent: number; // avg active seconds per visit
}

interface SectionStat {
  section_id: string;
  section_name: string;
  avgTimeSpent: number; // in seconds
  totalTimeSpent: number;
  viewCount: number;
}

interface DeviceStats {
  mobile: number;
  desktop: number;
  mobilePercentage: number;
  desktopPercentage: number;
}

interface StatsData {
  totalVisits: number;
  uniqueSessions: number;
  topPages: PageStat[];
  topSections: SectionStat[];
  deviceStats: DeviceStats;
  loading: boolean;
  error: string | null;
}

const AdminStats = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isPastor, loading: authLoading, rolesLoading } = useAuth();
  
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
  const [stats, setStats] = useState<StatsData>({
    totalVisits: 0,
    uniqueSessions: 0,
    topPages: [],
    topSections: [],
    deviceStats: { mobile: 0, desktop: 0, mobilePercentage: 0, desktopPercentage: 0 },
    loading: true,
    error: null
  });
  const [refreshing, setRefreshing] = useState(false);

  // Determine if we should show loading or redirect
  const isLoading = authLoading || rolesLoading;
  const isAuthorized = user && (isAdmin || isPastor);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    } else if (!isLoading && user && !isAdmin && !isPastor) {
      navigate("/");
    }
  }, [user, isAdmin, isPastor, isLoading, navigate]);

  const getDateRange = (filter: TimeFilter): { start: Date; end: Date } => {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    
    let start: Date;
    
    switch (filter) {
      case 'today':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start = new Date(now);
        start.setDate(now.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        break;
      case 'month':
        start = new Date(now);
        start.setMonth(now.getMonth() - 1);
        start.setHours(0, 0, 0, 0);
        break;
      default:
        start = new Date(now);
        start.setDate(now.getDate() - 7);
    }
    
    return { start, end };
  };

  const fetchStats = async () => {
    if (!user || (!isAdmin && !isPastor)) return;
    
    setStats(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { start, end } = getDateRange(timeFilter);
      
      // Fetch all visits in date range
      const { data: visits, error } = await supabase
        .from('page_visits')
        .select('*')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!visits || visits.length === 0) {
        setStats({
          totalVisits: 0,
          uniqueSessions: 0,
          topPages: [],
          topSections: [],
          deviceStats: { mobile: 0, desktop: 0, mobilePercentage: 0, desktopPercentage: 0 },
          loading: false,
          error: null
        });
        return;
      }

      // Calculate total visits
      const totalVisits = visits.length;

      // Calculate unique sessions
      const uniqueSessions = new Set(visits.map(v => v.session_id)).size;

      // Separate pages from sections
      const pageVisitCounts: Record<string, { path: string; name: string; count: number; totalTime: number }> = {};
      const sectionTimeData: Record<string, { sectionId: string; name: string; totalTime: number; viewCount: number }> = {};

      visits.forEach(visit => {
        const key = visit.page_path;
        const isSection = key.startsWith('/#');

        if (isSection) {
          const sectionId = key.replace('/#', '');
          const timeSpent = (visit as any).time_spent || 0;

          // Only count views with meaningful time (3+ seconds)
          if (timeSpent >= 3) {
            if (!sectionTimeData[sectionId]) {
              sectionTimeData[sectionId] = {
                sectionId,
                name: visit.page_name?.replace('Sección: ', '') || sectionId,
                totalTime: 0,
                viewCount: 0
              };
            }
            sectionTimeData[sectionId].totalTime += timeSpent;
            sectionTimeData[sectionId].viewCount++;
          }
        } else {
          if (!pageVisitCounts[key]) {
            pageVisitCounts[key] = {
              path: visit.page_path,
              name: visit.page_name || visit.page_path,
              count: 0,
              totalTime: 0
            };
          }
          pageVisitCounts[key].count++;
          pageVisitCounts[key].totalTime += (visit as any).time_spent || 0;
        }
      });

      const topPages: PageStat[] = Object.values(pageVisitCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(page => ({
          page_path: page.path,
          page_name: page.name,
          visits: page.count,
          percentage: Math.round((page.count / totalVisits) * 100),
          avgTimeSpent: page.count > 0 ? Math.round(page.totalTime / page.count) : 0
        }));

      // Calculate sections with most total viewing time (real engagement)
      const topSections: SectionStat[] = Object.values(sectionTimeData)
        .sort((a, b) => b.totalTime - a.totalTime) // Sort by total time spent
        .slice(0, 8)
        .map(section => ({
          section_id: section.sectionId,
          section_name: section.name,
          avgTimeSpent: section.viewCount > 0 ? Math.round(section.totalTime / section.viewCount) : 0,
          totalTimeSpent: Math.round(section.totalTime),
          viewCount: section.viewCount
        }));

      // Calculate device stats
      const mobileVisits = visits.filter(v => v.device_type === 'mobile').length;
      const desktopVisits = visits.filter(v => v.device_type === 'desktop').length;
      
      const deviceStats: DeviceStats = {
        mobile: mobileVisits,
        desktop: desktopVisits,
        mobilePercentage: totalVisits > 0 ? Math.round((mobileVisits / totalVisits) * 100) : 0,
        desktopPercentage: totalVisits > 0 ? Math.round((desktopVisits / totalVisits) * 100) : 0
      };

      setStats({
        totalVisits,
        uniqueSessions,
        topPages,
        topSections,
        deviceStats,
        loading: false,
        error: null
      });

    } catch (err) {
      console.error('Error fetching stats:', err);
      setStats(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Error al cargar las estadísticas. Intenta de nuevo.' 
      }));
    }
  };

  useEffect(() => {
    if (isAuthorized && !isLoading) {
      fetchStats();
    }
  }, [timeFilter, isAuthorized, isLoading]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  // Show nothing while redirecting unauthorized users
  if (!isAuthorized) {
    return null;
  }

  const filterLabels: Record<TimeFilter, string> = {
    today: 'Hoy',
    week: 'Esta Semana',
    month: 'Este Mes'
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Button variant="ghost" size="icon" asChild className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
              <Link to="/admin">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-semibold text-foreground flex items-center gap-1.5 sm:gap-2">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                <span className="truncate">Estadísticas</span>
              </h1>
              <p className="text-[10px] sm:text-sm text-muted-foreground truncate">Datos reales del sitio web</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing || stats.loading}
            className="flex-shrink-0 h-8 sm:h-9 px-2 sm:px-3"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", refreshing && "animate-spin")} />
            <span className="hidden sm:inline ml-2">Actualizar</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-6xl">
        {/* Time Filter */}
        <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto pb-1">
          {(['today', 'week', 'month'] as TimeFilter[]).map((filter) => (
            <Button
              key={filter}
              variant={timeFilter === filter ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeFilter(filter)}
              disabled={stats.loading}
              className={cn(
                "transition-all text-xs sm:text-sm h-8 sm:h-9 px-2.5 sm:px-4 flex-shrink-0",
                timeFilter === filter 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {filterLabels[filter]}
            </Button>
          ))}
        </div>

        {/* Error State */}
        {stats.error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">{stats.error}</p>
          </div>
        )}

        {/* Loading State */}
        {stats.loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="bg-background border-border">
                <CardHeader className="pb-2">
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
              {/* Total Visits */}
              <Card className="bg-background border-border">
                <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
                  <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground flex items-center gap-1 sm:gap-2">
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="truncate">Visitas Totales</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                  <div className="flex items-baseline gap-1 sm:gap-2">
                    <span className="text-xl sm:text-3xl font-bold text-foreground">
                      {stats.totalVisits.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                    {stats.uniqueSessions} sesiones únicas
                  </p>
                </CardContent>
              </Card>

              {/* Mobile Visits */}
              <Card className="bg-background border-border">
                <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
                  <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground flex items-center gap-1 sm:gap-2">
                    <Smartphone className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="truncate">Visitas Móvil</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                  <div className="flex items-baseline gap-1 sm:gap-2">
                    <span className="text-xl sm:text-3xl font-bold text-foreground">
                      {stats.deviceStats.mobilePercentage}%
                    </span>
                    <span className="text-[10px] sm:text-sm text-muted-foreground">
                      ({stats.deviceStats.mobile})
                    </span>
                  </div>
                  <div className="mt-1.5 sm:mt-2 h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${stats.deviceStats.mobilePercentage}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Desktop Visits */}
              <Card className="bg-background border-border">
                <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
                  <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground flex items-center gap-1 sm:gap-2">
                    <Monitor className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="truncate">Visitas Escritorio</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                  <div className="flex items-baseline gap-1 sm:gap-2">
                    <span className="text-xl sm:text-3xl font-bold text-foreground">
                      {stats.deviceStats.desktopPercentage}%
                    </span>
                    <span className="text-[10px] sm:text-sm text-muted-foreground">
                      ({stats.deviceStats.desktop})
                    </span>
                  </div>
                  <div className="mt-1.5 sm:mt-2 h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-secondary rounded-full transition-all duration-500"
                      style={{ width: `${stats.deviceStats.desktopPercentage}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Top Page */}
              <Card className="bg-background border-border">
                <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
                  <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground flex items-center gap-1 sm:gap-2">
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="truncate">Página Más Vista</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                  {stats.topPages.length > 0 ? (
                    <>
                      <div className="text-sm sm:text-xl font-semibold text-foreground truncate">
                        {stats.topPages[0]?.page_name || '-'}
                      </div>
                      <div className="text-[10px] sm:text-sm text-muted-foreground">
                        {stats.topPages[0]?.visits.toLocaleString()} visitas
                      </div>
                    </>
                  ) : (
                    <div className="text-muted-foreground text-xs sm:text-sm">Sin datos</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Top Pages */}
              <Card className="bg-background border-border">
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-1.5 sm:gap-2">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Páginas Más Visitadas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0 sm:pt-0">
                  {stats.topPages.length > 0 ? (
                    stats.topPages.map((page, index) => (
                      <div key={page.page_path} className="space-y-1 sm:space-y-1.5">
                        <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
                          <span className="text-foreground font-medium flex items-center gap-1.5 sm:gap-2 min-w-0 truncate">
                            <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-muted flex items-center justify-center text-[10px] sm:text-xs text-muted-foreground flex-shrink-0">
                              {index + 1}
                            </span>
                            <span className="truncate">{page.page_name}</span>
                          </span>
                          <span className="text-muted-foreground whitespace-nowrap flex-shrink-0 text-[10px] sm:text-sm flex items-center gap-1.5 sm:gap-2">
                            {page.avgTimeSpent > 0 && (
                              <span className="flex items-center gap-0.5 text-primary/80">
                                <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                {formatTime(page.avgTimeSpent)}
                              </span>
                            )}
                            <span>{page.visits.toLocaleString()}</span>
                          </span>
                        </div>
                        <div className="h-1 sm:h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary/70 rounded-full transition-all duration-500"
                            style={{ width: `${page.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 sm:py-8 text-muted-foreground">
                      <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 opacity-30" />
                      <p className="text-xs sm:text-sm">No hay datos de visitas para este período</p>
                      <p className="text-[10px] sm:text-xs mt-1">Las visitas se registran automáticamente</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Device Distribution Visual */}
              <Card className="bg-background border-border">
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-1.5 sm:gap-2">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Distribución por Dispositivo
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                  {stats.totalVisits > 0 ? (
                    <>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                        {/* Mobile */}
                        <div className="flex-1 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-muted/50 flex items-center gap-3 sm:gap-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Smartphone className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                          </div>
                          <div>
                            <div className="text-xl sm:text-2xl font-bold text-foreground">
                              {stats.deviceStats.mobilePercentage}%
                            </div>
                            <div className="text-xs sm:text-sm text-muted-foreground">
                              Móvil ({stats.deviceStats.mobile})
                            </div>
                          </div>
                        </div>
                        
                        {/* Desktop */}
                        <div className="flex-1 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-muted/50 flex items-center gap-3 sm:gap-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                            <Monitor className="h-5 w-5 sm:h-6 sm:w-6 text-secondary-foreground" />
                          </div>
                          <div>
                            <div className="text-xl sm:text-2xl font-bold text-foreground">
                              {stats.deviceStats.desktopPercentage}%
                            </div>
                            <div className="text-xs sm:text-sm text-muted-foreground">
                              Escritorio ({stats.deviceStats.desktop})
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Combined Progress Bar */}
                      <div className="mt-6">
                        <div className="h-4 rounded-full overflow-hidden flex bg-muted">
                          {stats.deviceStats.mobilePercentage > 0 && (
                            <div 
                              className="bg-primary transition-all duration-500 flex items-center justify-center"
                              style={{ width: `${stats.deviceStats.mobilePercentage}%` }}
                            >
                              {stats.deviceStats.mobilePercentage >= 10 && (
                                <span className="text-[10px] font-semibold text-primary-foreground">
                                  {stats.deviceStats.mobilePercentage}%
                                </span>
                              )}
                            </div>
                          )}
                          {stats.deviceStats.desktopPercentage > 0 && (
                            <div 
                              className="bg-secondary transition-all duration-500 flex items-center justify-center"
                              style={{ width: `${stats.deviceStats.desktopPercentage}%` }}
                            >
                              {stats.deviceStats.desktopPercentage >= 10 && (
                                <span className="text-[10px] font-semibold text-secondary-foreground">
                                  {stats.deviceStats.desktopPercentage}%
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-primary"></span>
                            Móvil
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-secondary"></span>
                            Escritorio
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6 sm:py-8 text-muted-foreground">
                      <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 opacity-30" />
                      <p className="text-xs sm:text-sm">No hay datos de dispositivos para este período</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sections with Most Viewing Time */}
            <Card className="bg-background border-border mt-4 sm:mt-6">
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-1.5 sm:gap-2">
                  <Layers className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Secciones con Mayor Tiempo
                </CardTitle>
                <p className="text-[10px] sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                  <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 inline mr-0.5 sm:mr-1" />
                  Ordenadas por tiempo de permanencia
                </p>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                {stats.topSections.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {/* Top section highlighted */}
                    {stats.topSections[0] && (
                      <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-primary/10 border border-primary/20">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                              <span className="font-semibold text-foreground text-sm sm:text-base truncate">
                                {stats.topSections[0].section_name}
                              </span>
                              <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium whitespace-nowrap">
                                Mayor permanencia
                              </span>
                            </div>
                            <div className="text-[10px] sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 flex flex-wrap items-center gap-1.5 sm:gap-3">
                              <span className="flex items-center gap-0.5 sm:gap-1">
                                <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                {formatTime(stats.topSections[0].avgTimeSpent)}
                              </span>
                              <span className="hidden sm:inline">•</span>
                              <span>{stats.topSections[0].viewCount} visualizaciones</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Other sections */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                      {stats.topSections.slice(1).map((section, index) => (
                        <div 
                          key={section.section_id}
                          className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-muted flex items-center justify-center text-xs sm:text-sm font-medium text-muted-foreground shrink-0">
                            {index + 2}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-foreground text-xs sm:text-sm truncate">{section.section_name}</div>
                            <div className="text-[10px] sm:text-sm text-muted-foreground flex items-center gap-0.5 sm:gap-1">
                              <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              {formatTime(section.avgTimeSpent)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Explanation */}
                    <div className="mt-3 sm:mt-4 p-2 sm:p-3 rounded-lg bg-muted/30 border border-border">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        💡 <strong>¿Cómo se mide?</strong> Solo se cuentan las secciones donde los usuarios permanecieron 
                        al menos 3 segundos.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Layers className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No hay datos de secciones para este período</p>
                    <p className="text-xs mt-1">El tiempo de visualización se registra cuando los usuarios hacen scroll y permanecen en cada sección</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info Note */}
            <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground text-center">
                📊 Mostrando datos reales del período: <strong>{filterLabels[timeFilter]}</strong>. 
                Las visitas y tiempos se registran automáticamente cuando los usuarios navegan el sitio.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

// Helper function to format time in a readable way
const formatTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) {
    return `${minutes}min`;
  }
  return `${minutes}min ${remainingSeconds}s`;
};

export default AdminStats;
