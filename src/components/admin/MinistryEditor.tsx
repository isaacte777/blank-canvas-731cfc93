import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useImageUpload } from '@/hooks/useImageUpload';
import { 
  Users, Music, Heart, BookOpen, Church, Calendar, Clock,
  Edit3, Upload, Loader2, X, Trash2, Image as ImageIcon,
  Plus, Baby, GraduationCap, Flame, Eye, EyeOff, Check
} from 'lucide-react';

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
  is_visible: boolean;
  display_order: number;
  isNew?: boolean;
  isDeleted?: boolean;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  Music,
  Heart,
  BookOpen,
  Church,
  Calendar,
  Clock,
  Baby,
  GraduationCap,
  Flame
};

const iconLabels: Record<string, string> = {
  Users: 'Personas',
  Music: 'Música',
  Heart: 'Corazón',
  BookOpen: 'Libro',
  Church: 'Iglesia',
  Calendar: 'Calendario',
  Clock: 'Reloj',
  Baby: 'Niños',
  GraduationCap: 'Jóvenes',
  Flame: 'Fuego'
};

interface MinistryEditorProps {
  ministries: Ministry[];
  pendingChanges: Map<string, Partial<Ministry> & { isNew?: boolean; isDeleted?: boolean }>;
  onAddMinistry: (ministry: Omit<Ministry, 'id'> & { id: string; isNew: boolean }) => void;
  onUpdateMinistry: (id: string, changes: Partial<Ministry>) => void;
  onDeleteMinistry: (id: string) => void;
  onToggleVisibility: (id: string, isVisible: boolean) => void;
}

export const MinistryEditor = ({ 
  ministries, 
  pendingChanges,
  onAddMinistry, 
  onUpdateMinistry, 
  onDeleteMinistry,
  onToggleVisibility 
}: MinistryEditorProps) => {
  const { toast } = useToast();
  const { uploadImage, uploading } = useImageUpload();
  
  const [editingMinistry, setEditingMinistry] = useState<Ministry | null>(null);
  const [showAddMinistry, setShowAddMinistry] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    slug: '',
    description: '',
    content: '',
    schedule: '',
    leader: '',
    image_url: '',
    icon: 'Users'
  });
  const imageInputRef = useRef<HTMLInputElement>(null);
  const addImageInputRef = useRef<HTMLInputElement>(null);

  // Merge ministries with pending changes for display
  const getMergedMinistries = () => {
    const merged = new Map<string, Ministry>();
    
    // Add existing ministries
    ministries.forEach(m => {
      merged.set(m.id, { ...m });
    });
    
    // Apply pending changes
    pendingChanges.forEach((changes, id) => {
      if (changes.isDeleted) {
        merged.delete(id);
      } else if (changes.isNew) {
        merged.set(id, {
          id,
          slug: changes.slug || '',
          title: changes.title || '',
          description: changes.description || null,
          content: changes.content || null,
          image_url: changes.image_url || null,
          icon: changes.icon || 'Users',
          schedule: changes.schedule || null,
          leader: changes.leader || null,
          is_visible: changes.is_visible ?? true,
          display_order: changes.display_order || 0,
          isNew: true
        });
      } else {
        const existing = merged.get(id);
        if (existing) {
          merged.set(id, { ...existing, ...changes });
        }
      }
    });
    
    return Array.from(merged.values()).sort((a, b) => a.display_order - b.display_order);
  };

  const displayMinistries = getMergedMinistries();

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const openEditor = (ministry: Ministry) => {
    // Get current state including pending changes
    const pendingChange = pendingChanges.get(ministry.id);
    const currentState = pendingChange ? { ...ministry, ...pendingChange } : ministry;
    
    setEditingMinistry(currentState);
    setEditForm({
      title: currentState.title || '',
      slug: currentState.slug || '',
      description: currentState.description || '',
      content: currentState.content || '',
      schedule: currentState.schedule || '',
      leader: currentState.leader || '',
      image_url: currentState.image_url || '',
      icon: currentState.icon || 'Users'
    });
  };

  const openAddDialog = () => {
    setEditForm({
      title: '',
      slug: '',
      description: '',
      content: '',
      schedule: '',
      leader: '',
      image_url: '',
      icon: 'Users'
    });
    setShowAddMinistry(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isNew: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const folder = isNew ? `ministries/new-${Date.now()}` : `ministries/${editingMinistry?.slug || 'temp'}`;
    const url = await uploadImage(file, folder);
    if (url) {
      setEditForm(prev => ({ ...prev, image_url: url }));
    }
  };

  const handleSave = () => {
    if (!editingMinistry) return;
    
    onUpdateMinistry(editingMinistry.id, {
      title: editForm.title,
      slug: editForm.slug || generateSlug(editForm.title),
      description: editForm.description || null,
      content: editForm.content || null,
      schedule: editForm.schedule || null,
      leader: editForm.leader || null,
      image_url: editForm.image_url || null,
      icon: editForm.icon
    });
    
    toast({ title: "Cambios aplicados", description: "Presiona 'Guardar Edits' para guardar definitivamente" });
    setEditingMinistry(null);
  };

  const handleAdd = () => {
    if (displayMinistries.length >= 20) {
      toast({ title: "Límite alcanzado", description: "No puedes agregar más de 20 ministerios", variant: "destructive" });
      return;
    }
    
    if (!editForm.title) {
      toast({ title: "Error", description: "El título es obligatorio", variant: "destructive" });
      return;
    }
    
    const tempId = `temp-${Date.now()}`;
    const slug = editForm.slug || generateSlug(editForm.title);
    
    onAddMinistry({
      id: tempId,
      title: editForm.title,
      slug,
      description: editForm.description || null,
      content: editForm.content || null,
      schedule: editForm.schedule || null,
      leader: editForm.leader || null,
      image_url: editForm.image_url || null,
      icon: editForm.icon || 'Users',
      is_visible: true,
      display_order: displayMinistries.length,
      isNew: true
    });
    
    toast({ title: "Ministerio agregado", description: "Presiona 'Guardar Edits' para guardar definitivamente" });
    setShowAddMinistry(false);
  };

  const handleDelete = () => {
    if (!editingMinistry) return;
    
    onDeleteMinistry(editingMinistry.id);
    toast({ title: "Ministerio marcado para eliminar", description: "Presiona 'Guardar Edits' para confirmar la eliminación" });
    setEditingMinistry(null);
  };

  const handleToggleVisibility = (ministry: Ministry) => {
    onToggleVisibility(ministry.id, !ministry.is_visible);
  };

  const renderForm = (isNew: boolean = false) => (
    <div className="space-y-3 sm:space-y-4">
      {/* Image Section */}
      <div className="space-y-2">
        <Label className="text-xs sm:text-sm">Imagen / Logo del Ministerio</Label>
        <div className="relative rounded-lg overflow-hidden border border-border bg-muted/30 h-32 sm:h-40">
          {editForm.image_url ? (
            <img 
              src={editForm.image_url} 
              alt="Preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <ImageIcon className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-1 sm:mb-2 opacity-50" />
                <p className="text-xs sm:text-sm">Sin imagen</p>
              </div>
            </div>
          )}
        </div>
        <input
          ref={isNew ? addImageInputRef : imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleImageUpload(e, isNew)}
        />
        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => isNew ? addImageInputRef.current?.click() : imageInputRef.current?.click()}
            disabled={uploading}
            className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
          >
            {uploading ? (
              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
            ) : (
              <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            )}
            {editForm.image_url ? 'Cambiar' : 'Subir'}
          </Button>
          {editForm.image_url && (
            <Button 
              type="button" 
              variant="destructive" 
              size="sm"
              onClick={() => setEditForm(prev => ({ ...prev, image_url: '' }))}
              className="h-8 sm:h-9"
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Icon Selection */}
      <div className="space-y-2">
        <Label className="text-xs sm:text-sm">Ícono (se muestra si no hay imagen)</Label>
        <Select
          value={editForm.icon}
          onValueChange={(value) => setEditForm(prev => ({ ...prev, icon: value }))}
        >
          <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(iconLabels).map(([key, label]) => {
              const Icon = iconMap[key];
              return (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm">{label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Title */}
      <div className="space-y-1 sm:space-y-2">
        <Label className="text-xs sm:text-sm">Título *</Label>
        <Input
          value={editForm.title}
          onChange={(e) => {
            setEditForm(prev => ({ 
              ...prev, 
              title: e.target.value,
              slug: isNew ? generateSlug(e.target.value) : prev.slug
            }));
          }}
          placeholder="Nombre del ministerio"
          className="h-8 sm:h-10 text-xs sm:text-sm"
        />
      </div>

      {/* Description */}
      <div className="space-y-1 sm:space-y-2">
        <Label className="text-xs sm:text-sm">Descripción Corta</Label>
        <Input
          value={editForm.description}
          onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Breve descripción"
          className="h-8 sm:h-10 text-xs sm:text-sm"
        />
      </div>

      {/* Content */}
      <div className="space-y-1 sm:space-y-2">
        <Label className="text-xs sm:text-sm">Contenido Detallado</Label>
        <Textarea
          value={editForm.content}
          onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
          placeholder="Descripción completa del ministerio..."
          rows={2}
          className="text-xs sm:text-sm min-h-[60px] sm:min-h-[80px]"
        />
      </div>

      {/* Schedule and Leader - Side by side on larger screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-1 sm:space-y-2">
          <Label className="text-xs sm:text-sm">Horario</Label>
          <Input
            value={editForm.schedule}
            onChange={(e) => setEditForm(prev => ({ ...prev, schedule: e.target.value }))}
            placeholder="Ej: Domingos 10:00 AM"
            className="h-8 sm:h-10 text-xs sm:text-sm"
          />
        </div>
        <div className="space-y-1 sm:space-y-2">
          <Label className="text-xs sm:text-sm">Líder / Responsable</Label>
          <Input
            value={editForm.leader}
            onChange={(e) => setEditForm(prev => ({ ...prev, leader: e.target.value }))}
            placeholder="Nombre del líder"
            className="h-8 sm:h-10 text-xs sm:text-sm"
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Ministry Cards Section */}
      <div className="py-8 sm:py-10 md:py-12 bg-muted/30">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground font-heading mb-2">
              Ministerios
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground px-2">
              Haz clic en cualquier ministerio para editarlo
            </p>
          </div>
          
          {/* Add button */}
          <div className="flex flex-col items-center gap-2 mb-4 sm:mb-6">
            <Button 
              onClick={openAddDialog} 
              size="sm" 
              className="gap-2 text-xs sm:text-sm"
              disabled={displayMinistries.length >= 20}
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              Agregar Ministerio
            </Button>
            <p className="text-xs text-muted-foreground">
              {displayMinistries.length}/20 ministerios
            </p>
          </div>
          
          {displayMinistries.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-muted-foreground">
              <Users className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-30" />
              <p className="text-sm sm:text-base">No hay ministerios configurados</p>
              <p className="text-xs sm:text-sm">Haz clic en "Agregar Ministerio" para crear uno</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
              {displayMinistries.map((ministry) => {
                const Icon = iconMap[ministry.icon || 'Users'] || Users;
                const hasPendingChanges = pendingChanges.has(ministry.id);
                return (
                  <Card 
                    key={ministry.id}
                    className={`group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden ${
                      !ministry.is_visible ? 'opacity-50' : ''
                    } ${hasPendingChanges ? 'ring-2 ring-primary/50' : ''}`}
                    onClick={() => openEditor(ministry)}
                  >
                    {/* Image Preview */}
                    <div className="relative aspect-square bg-gradient-to-br from-primary/20 to-accent/10 overflow-hidden">
                      {ministry.image_url ? (
                        <img 
                          src={ministry.image_url} 
                          alt={ministry.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary/50" />
                        </div>
                      )}
                      
                      {/* Pending changes indicator */}
                      {hasPendingChanges && (
                        <div className="absolute top-1 left-1 sm:top-2 sm:left-2 p-1 sm:p-1.5 rounded-full bg-primary text-primary-foreground">
                          <Check className="h-2 w-2 sm:h-3 sm:w-3" />
                        </div>
                      )}
                      
                      {/* Visibility indicator */}
                      {!ministry.is_visible && !hasPendingChanges && (
                        <div className="absolute top-1 left-1 sm:top-2 sm:left-2 p-1 sm:p-1.5 rounded-full bg-destructive/80 text-destructive-foreground">
                          <EyeOff className="h-2 w-2 sm:h-3 sm:w-3" />
                        </div>
                      )}
                      
                      {/* Edit indicator */}
                      <div className="absolute top-1 right-1 sm:top-2 sm:right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="p-1 sm:p-1.5 rounded-full bg-primary text-primary-foreground">
                          <Edit3 className="h-2 w-2 sm:h-3 sm:w-3" />
                        </div>
                      </div>
                    </div>
                    
                    <CardContent className="p-2 sm:p-3">
                      <h3 className="font-semibold text-[10px] sm:text-xs md:text-sm text-foreground truncate">
                        {ministry.title}
                      </h3>
                      {ministry.description && (
                        <p className="text-[8px] sm:text-[10px] md:text-xs text-muted-foreground line-clamp-1 mt-0.5 sm:mt-1">
                          {ministry.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Ministry Dialog */}
      <Dialog open={editingMinistry !== null} onOpenChange={(open) => !open && setEditingMinistry(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[85vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Edit3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Editar Ministerio
            </DialogTitle>
          </DialogHeader>
          
          {renderForm(false)}

          <DialogFooter className="flex-col gap-2 pt-3 sm:pt-4 border-t">
            <div className="flex gap-2 w-full">
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDelete}
                className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
              >
                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Eliminar
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => editingMinistry && handleToggleVisibility(editingMinistry)}
                className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
              >
                {editingMinistry?.is_visible ? (
                  <>
                    <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    Ocultar
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    Mostrar
                  </>
                )}
              </Button>
            </div>
            <div className="flex gap-2 w-full">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setEditingMinistry(null)}
                className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Cancelar
              </Button>
              <Button 
                size="sm"
                onClick={handleSave}
                disabled={uploading}
                className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
              >
                <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Aplicar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Ministry Dialog */}
      <Dialog open={showAddMinistry} onOpenChange={setShowAddMinistry}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[85vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Agregar Ministerio
            </DialogTitle>
          </DialogHeader>
          
          {renderForm(true)}

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-3 sm:pt-4 border-t">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAddMinistry(false)}
              className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Cancelar
            </Button>
            <Button 
              size="sm"
              onClick={handleAdd}
              disabled={uploading || !editForm.title}
              className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
