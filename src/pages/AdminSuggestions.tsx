import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { 
  Loader2, 
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  X,
  Calendar,
  Link as LinkIcon,
  FileText,
  CheckCircle2,
  Check,
  Circle,
  Clock,
  AlertCircle,
  ExternalLink,
  Edit3,
  Lightbulb
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import cfaAdminLogo from "@/assets/cfa-admin-logo.png";

interface AdminSuggestion {
  id: string;
  title: string;
  description: string | null;
  suggestion_type: string;
  target_date: string | null;
  target_time: string | null;
  link_url: string | null;
  link_label: string | null;
  is_completed: boolean;
  priority: string;
  created_by: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

const priorityColors: Record<string, string> = {
  low: 'bg-slate-100 text-slate-700 border-slate-200',
  normal: 'bg-blue-100 text-blue-700 border-blue-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  urgent: 'bg-red-100 text-red-700 border-red-200'
};

const priorityLabels: Record<string, string> = {
  low: 'Baja',
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente'
};

const typeLabels: Record<string, string> = {
  note: 'Nota',
  event_draft: 'Borrador Evento',
  link: 'Enlace',
  task: 'Tarea'
};

const typeIcons: Record<string, React.ReactNode> = {
  note: <FileText className="w-4 h-4" />,
  event_draft: <Calendar className="w-4 h-4" />,
  link: <LinkIcon className="w-4 h-4" />,
  task: <CheckCircle2 className="w-4 h-4" />
};

const AdminSuggestions = () => {
  const { user, isAdmin, loading, rolesLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [suggestions, setSuggestions] = useState<AdminSuggestion[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSuggestion, setEditingSuggestion] = useState<AdminSuggestion | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCompleted, setFilterCompleted] = useState<string>('pending');
  const [confirmingComplete, setConfirmingComplete] = useState<string | null>(null);
  const [confirmStep, setConfirmStep] = useState<1 | 2>(1);
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    suggestion_type: 'note',
    target_date: '',
    target_time: '',
    link_url: '',
    link_label: '',
    priority: 'normal'
  });

  // Auto-logout after 5 minutes of inactivity
  const handleIdleLogout = useCallback(async () => {
    toast({
      title: "Sesión expirada",
      description: "Se cerró la sesión por inactividad",
    });
    await signOut();
    navigate('/auth');
  }, [signOut, navigate, toast]);

  useIdleTimeout({
    timeout: 5 * 60 * 1000,
    onIdle: handleIdleLogout,
    enabled: !!user && isAdmin
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchSuggestions();
    }
  }, [user, isAdmin]);

  const fetchSuggestions = async () => {
    setDataLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_suggestions')
        .select('*')
        .order('target_date', { ascending: true, nullsFirst: false })
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error: any) {
      console.error('Error fetching suggestions:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las sugerencias",
        variant: "destructive"
      });
    } finally {
      setDataLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      suggestion_type: 'note',
      target_date: '',
      target_time: '',
      link_url: '',
      link_label: '',
      priority: 'normal'
    });
  };

  const handleAddSuggestion = async () => {
    if (!form.title.trim()) {
      toast({
        title: "Error",
        description: "El título es requerido",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('admin_suggestions')
        .insert({
          title: form.title,
          description: form.description || null,
          suggestion_type: form.suggestion_type,
          target_date: form.target_date || null,
          target_time: form.target_time || null,
          link_url: form.link_url || null,
          link_label: form.link_label || null,
          priority: form.priority,
          created_by: user?.id
        });

      if (error) throw error;

      toast({
        title: "¡Listo!",
        description: "Sugerencia agregada correctamente"
      });
      setShowAddDialog(false);
      resetForm();
      fetchSuggestions();
    } catch (error: any) {
      console.error('Error adding suggestion:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo agregar la sugerencia",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSuggestion = async () => {
    if (!editingSuggestion) return;
    
    if (!form.title.trim()) {
      toast({
        title: "Error",
        description: "El título es requerido",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('admin_suggestions')
        .update({
          title: form.title,
          description: form.description || null,
          suggestion_type: form.suggestion_type,
          target_date: form.target_date || null,
          target_time: form.target_time || null,
          link_url: form.link_url || null,
          link_label: form.link_label || null,
          priority: form.priority
        })
        .eq('id', editingSuggestion.id);

      if (error) throw error;

      toast({
        title: "¡Listo!",
        description: "Sugerencia actualizada correctamente"
      });
      setEditingSuggestion(null);
      resetForm();
      fetchSuggestions();
    } catch (error: any) {
      console.error('Error updating suggestion:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la sugerencia",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSuggestion = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta sugerencia?')) return;

    try {
      const { error } = await supabase
        .from('admin_suggestions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Eliminado",
        description: "Sugerencia eliminada correctamente"
      });
      fetchSuggestions();
    } catch (error: any) {
      console.error('Error deleting suggestion:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la sugerencia",
        variant: "destructive"
      });
    }
  };

  const handleToggleComplete = async (suggestion: AdminSuggestion) => {
    // If already completed, allow toggling back to pending without confirmation
    if (suggestion.is_completed) {
      try {
        const { error } = await supabase
          .from('admin_suggestions')
          .update({ is_completed: false })
          .eq('id', suggestion.id);

        if (error) throw error;

        setSuggestions(prev => 
          prev.map(s => s.id === suggestion.id ? { ...s, is_completed: false } : s)
        );

        toast({
          title: "Marcado como pendiente",
          description: "La tarea está pendiente nuevamente"
        });
      } catch (error: any) {
        console.error('Error toggling complete:', error);
        toast({
          title: "Error",
          description: "No se pudo actualizar el estado",
          variant: "destructive"
        });
      }
      return;
    }

    // For completing a task, require double confirmation
    if (confirmingComplete === suggestion.id) {
      if (confirmStep === 1) {
        // First confirmation - ask again
        setConfirmStep(2);
        return;
      }
      // Second confirmation - actually complete
      try {
        const { error } = await supabase
          .from('admin_suggestions')
          .update({ is_completed: true })
          .eq('id', suggestion.id);

        if (error) throw error;

        setSuggestions(prev => 
          prev.map(s => s.id === suggestion.id ? { ...s, is_completed: true } : s)
        );

        toast({
          title: "¡Completado!",
          description: "Tarea marcada como completada"
        });
      } catch (error: any) {
        console.error('Error toggling complete:', error);
        toast({
          title: "Error",
          description: "No se pudo actualizar el estado",
          variant: "destructive"
        });
      }
      // Reset confirmation state
      setConfirmingComplete(null);
      setConfirmStep(1);
    } else {
      // Start confirmation process
      setConfirmingComplete(suggestion.id);
      setConfirmStep(1);
    }
  };

  const cancelConfirmation = () => {
    setConfirmingComplete(null);
    setConfirmStep(1);
  };

  const openEditDialog = (suggestion: AdminSuggestion) => {
    setForm({
      title: suggestion.title,
      description: suggestion.description || '',
      suggestion_type: suggestion.suggestion_type,
      target_date: suggestion.target_date || '',
      target_time: suggestion.target_time || '',
      link_url: suggestion.link_url || '',
      link_label: suggestion.link_label || '',
      priority: suggestion.priority || 'normal'
    });
    setEditingSuggestion(suggestion);
  };

  const filteredSuggestions = suggestions.filter(s => {
    if (filterType !== 'all' && s.suggestion_type !== filterType) return false;
    if (filterCompleted === 'pending' && s.is_completed) return false;
    if (filterCompleted === 'completed' && !s.is_completed) return false;
    return true;
  });

  // Sort by date proximity
  const sortedSuggestions = [...filteredSuggestions].sort((a, b) => {
    // Priority order: urgent > high > normal > low
    const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
    
    // First by completion status (pending first)
    if (a.is_completed !== b.is_completed) {
      return a.is_completed ? 1 : -1;
    }
    
    // Then by target date (closer dates first)
    if (a.target_date && b.target_date) {
      return new Date(a.target_date).getTime() - new Date(b.target_date).getTime();
    }
    if (a.target_date) return -1;
    if (b.target_date) return 1;
    
    // Then by priority
    return (priorityOrder[a.priority as keyof typeof priorityOrder] || 2) - 
           (priorityOrder[b.priority as keyof typeof priorityOrder] || 2);
  });

  if (loading || rolesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary/90 via-primary/80 to-secondary/90 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-primary/20">
        <div className="px-3 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white/80 hover:text-white hover:bg-white/20"
              onClick={() => navigate('/admin')}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Volver</span>
            </Button>
            <div className="w-px h-6 bg-white/20" />
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-300" />
              <h1 className="text-white text-sm sm:text-lg font-bold tracking-wide">Sugerencias</h1>
            </div>
          </div>
          <Button 
            onClick={() => { resetForm(); setShowAddDialog(true); }}
            className="bg-white/20 hover:bg-white/30 text-white border-0"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Nueva</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-8 px-3 sm:px-6">
        {/* Filters */}
        <Card className="mb-6 border-border/50">
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground whitespace-nowrap">Tipo:</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="note">Notas</SelectItem>
                    <SelectItem value="event_draft">Borradores</SelectItem>
                    <SelectItem value="link">Enlaces</SelectItem>
                    <SelectItem value="task">Tareas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground whitespace-nowrap">Estado:</Label>
                <Select value={filterCompleted} onValueChange={setFilterCompleted}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendientes</SelectItem>
                    <SelectItem value="completed">Completados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="ml-auto text-sm text-muted-foreground">
                {filteredSuggestions.length} {filteredSuggestions.length === 1 ? 'elemento' : 'elementos'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Suggestions List */}
        {dataLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : sortedSuggestions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No hay sugerencias</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => { resetForm(); setShowAddDialog(true); }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar primera sugerencia
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {sortedSuggestions.map((suggestion) => (
              <Card 
                key={suggestion.id} 
                className={`transition-all hover:shadow-md ${
                  suggestion.is_completed ? 'opacity-60 bg-muted/30' : ''
                } ${confirmingComplete === suggestion.id ? 'ring-2 ring-green-500/50 bg-green-50/50 dark:bg-green-950/20' : ''}`}
              >
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    {/* Checkbox with double confirmation */}
                    {confirmingComplete === suggestion.id && !suggestion.is_completed ? (
                      <div className="mt-1 shrink-0 flex items-center gap-2">
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                          {confirmStep === 1 ? '¿Completar?' : '¿Seguro?'}
                        </span>
                        <button
                          onClick={() => handleToggleComplete(suggestion)}
                          className={`p-1.5 rounded-full transition-colors ${
                            confirmStep === 1 
                              ? 'bg-green-500 hover:bg-green-600 text-white' 
                              : 'bg-green-600 hover:bg-green-700 text-white animate-pulse'
                          }`}
                          title={confirmStep === 1 ? "Confirmar" : "Sí, completar"}
                        >
                          {confirmStep === 1 ? <Check className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={cancelConfirmation}
                          className={`p-1.5 rounded-full transition-colors ${
                            confirmStep === 1 
                              ? 'bg-muted hover:bg-muted/80' 
                              : 'bg-destructive/80 hover:bg-destructive text-white'
                          }`}
                          title="Cancelar"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleToggleComplete(suggestion)}
                        className="mt-1 shrink-0"
                      >
                        {suggestion.is_completed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                        )}
                      </button>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className={`font-medium ${suggestion.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                          {suggestion.title}
                        </h3>
                        <Badge variant="outline" className="text-[10px] gap-1">
                          {typeIcons[suggestion.suggestion_type]}
                          {typeLabels[suggestion.suggestion_type]}
                        </Badge>
                        <Badge className={`text-[10px] ${priorityColors[suggestion.priority]}`}>
                          {priorityLabels[suggestion.priority]}
                        </Badge>
                      </div>

                      {suggestion.description && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {suggestion.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {suggestion.target_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(suggestion.target_date), "d 'de' MMMM, yyyy", { locale: es })}
                            {suggestion.target_time && (
                              <span className="ml-1 text-primary font-medium">
                                a las {suggestion.target_time.slice(0, 5)}
                              </span>
                            )}
                          </span>
                        )}
                        
                        {suggestion.link_url && (
                          <a 
                            href={suggestion.link_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-3 w-3" />
                            {suggestion.link_label || 'Abrir enlace'}
                          </a>
                        )}

                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(suggestion.created_at), "d MMM", { locale: es })}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(suggestion)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteSuggestion(suggestion.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Add/Edit Dialog */}
      <Dialog 
        open={showAddDialog || editingSuggestion !== null} 
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setEditingSuggestion(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              {editingSuggestion ? 'Editar Sugerencia' : 'Nueva Sugerencia'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input 
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="¿Qué hay que hacer?"
              />
            </div>

            {/* Type & Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select 
                  value={form.suggestion_type} 
                  onValueChange={(v) => setForm({ ...form, suggestion_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="note">
                      <span className="flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Nota
                      </span>
                    </SelectItem>
                    <SelectItem value="event_draft">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> Borrador Evento
                      </span>
                    </SelectItem>
                    <SelectItem value="link">
                      <span className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4" /> Enlace
                      </span>
                    </SelectItem>
                    <SelectItem value="task">
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> Tarea
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select 
                  value={form.priority} 
                  onValueChange={(v) => setForm({ ...form, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea 
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Detalles adicionales..."
                rows={3}
              />
            </div>

            {/* Target Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Fecha objetivo
                </Label>
                <Input 
                  type="date"
                  value={form.target_date}
                  onChange={(e) => setForm({ ...form, target_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Hora límite
                </Label>
                <Input 
                  type="time"
                  value={form.target_time}
                  onChange={(e) => setForm({ ...form, target_time: e.target.value })}
                  placeholder="HH:MM"
                />
              </div>
            </div>

            {/* Link Fields */}
            {(form.suggestion_type === 'link' || form.link_url) && (
              <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    URL del enlace
                  </Label>
                  <Input 
                    value={form.link_url}
                    onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                    placeholder="https://drive.google.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Etiqueta del enlace</Label>
                  <Input 
                    value={form.link_label}
                    onChange={(e) => setForm({ ...form, link_label: e.target.value })}
                    placeholder="Ej: Carpeta de recursos, Documento..."
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => { 
                  setShowAddDialog(false); 
                  setEditingSuggestion(null); 
                  resetForm(); 
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
              <Button 
                onClick={editingSuggestion ? handleUpdateSuggestion : handleAddSuggestion}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                {editingSuggestion ? 'Guardar Cambios' : 'Agregar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSuggestions;
