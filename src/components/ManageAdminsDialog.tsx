import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, Trash2, Edit, ShieldAlert, UserPlus, X, Save } from 'lucide-react';
import { z } from 'zod';

const adminSchema = z.object({
  email: z.string().trim().email({ message: "Email inválido" }).max(255),
  password: z.string().min(12, { message: "La contraseña debe tener al menos 12 caracteres" }).max(100),
  fullName: z.string().trim().min(2, { message: "El nombre debe tener al menos 2 caracteres" }).max(100)
});

const editSchema = z.object({
  email: z.string().trim().email({ message: "Email inválido" }).max(255).optional(),
  password: z.string().min(12, { message: "La contraseña debe tener al menos 12 caracteres" }).max(100).optional().or(z.literal('')),
  fullName: z.string().trim().min(2, { message: "El nombre debe tener al menos 2 caracteres" }).max(100).optional()
});

interface AdminUser {
  user_id: string;
  role: string;
  email: string | null;
  full_name: string | null;
}

interface ManageAdminsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPastor: boolean;
}

export const ManageAdminsDialog = ({ open, onOpenChange, isPastor }: ManageAdminsDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['admin', 'pastor', 'owner']);

      if (error) throw error;

      // Get profiles for these users
      const userIds = data?.map(r => r.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      const adminList: AdminUser[] = data?.map(r => {
        const profile = profiles?.find(p => p.id === r.user_id);
        return {
          user_id: r.user_id,
          role: r.role,
          email: profile?.email || null,
          full_name: profile?.full_name || null
        };
      }) || [];

      setAdmins(adminList);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los administradores",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open && isPastor) {
      fetchAdmins();
      setView('list');
    }
  }, [open, isPastor]);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = adminSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      // Use edge function to create admin without losing pastor's session
      const { data, error } = await supabase.functions.invoke('create-admin', {
        body: {
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName
        }
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message || "No se pudo crear el administrador",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      if (data?.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      toast({
        title: "Admin creado",
        description: `${formData.fullName} ahora es administrador`
      });
      setFormData({ email: '', password: '', fullName: '' });
      setView('list');
      fetchAdmins();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error inesperado",
        variant: "destructive"
      });
    }

    setLoading(false);
  };

  const handleEditAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;
    setErrors({});

    const dataToValidate: Record<string, string> = {};
    if (formData.email) dataToValidate.email = formData.email;
    if (formData.password) dataToValidate.password = formData.password;
    if (formData.fullName) dataToValidate.fullName = formData.fullName;

    const result = editSchema.safeParse(dataToValidate);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      // Update profile if name or email changed
      if (formData.fullName || formData.email) {
        const updateData: Record<string, string> = {};
        if (formData.fullName) updateData.full_name = formData.fullName;
        if (formData.email) updateData.email = formData.email;

        const { error: profileError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', selectedAdmin.user_id);

        if (profileError) {
          toast({
            title: "Error",
            description: "No se pudo actualizar el perfil",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
      }

      toast({
        title: "Admin actualizado",
        description: "Los cambios han sido guardados"
      });
      
      setFormData({ email: '', password: '', fullName: '' });
      setSelectedAdmin(null);
      setView('list');
      fetchAdmins();
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive"
      });
    }

    setLoading(false);
  };

  const handleRemoveAdmin = async (admin: AdminUser) => {
    if (admin.role === 'pastor' || admin.role === 'owner') {
      toast({
        title: "No permitido",
        description: "No puedes eliminar al dueño",
        variant: "destructive"
      });
      return;
    }

    if (!confirm(`¿Estás seguro de ELIMINAR COMPLETAMENTE a ${admin.full_name || admin.email}? Esta acción no se puede deshacer.`)) {
      return;
    }

    setLoading(true);

    try {
      // Delete user completely using edge function
      const { data, error } = await supabase.functions.invoke('delete-admin', {
        body: { userId: admin.user_id }
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message || "No se pudo eliminar el usuario",
          variant: "destructive"
        });
      } else if (data?.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Usuario eliminado",
          description: `${admin.full_name || admin.email} ha sido eliminado completamente`
        });
        fetchAdmins();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive"
      });
    }

    setLoading(false);
  };

  const startEdit = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setFormData({
      email: admin.email || '',
      password: '',
      fullName: admin.full_name || ''
    });
    setView('edit');
  };

  const resetAndClose = () => {
    setFormData({ email: '', password: '', fullName: '' });
    setErrors({});
    setSelectedAdmin(null);
    setView('list');
    onOpenChange(false);
  };

  // If not pastor, show access denied message
  if (!isPastor) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              Acceso Denegado
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="text-muted-foreground">
              No tienes acceso a esta función. Habla con el pastor.
            </p>
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {view === 'list' && 'Gestionar Administradores'}
            {view === 'add' && 'Agregar Nuevo Administrador'}
            {view === 'edit' && 'Editar Administrador'}
          </DialogTitle>
        </DialogHeader>

        {view === 'list' && (
          <div className="space-y-4">
            <Button 
              onClick={() => setView('add')} 
              className="w-full"
              disabled={loading}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Agregar Nuevo Admin
            </Button>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-2">
                {admins.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No hay administradores registrados
                  </p>
                ) : (
                  admins.map((admin) => (
                    <div 
                      key={admin.user_id} 
                      className="flex items-center justify-between p-3 border rounded-lg bg-card"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {admin.full_name || 'Sin nombre'}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {admin.email}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          admin.role === 'pastor' || admin.role === 'owner'
                            ? 'bg-red-500/20 text-red-600' 
                            : 'bg-blue-500/20 text-blue-600'
                        }`}>
                          {admin.role === 'pastor' || admin.role === 'owner' ? 'DUEÑO' : 'Admin'}
                        </span>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEdit(admin)}
                          disabled={loading}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {admin.role !== 'pastor' && admin.role !== 'owner' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveAdmin(admin)}
                            disabled={loading}
                            className="text-destructive hover:text-destructive"
                            title="Quitar acceso"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {view === 'add' && (
          <form onSubmit={handleAddAdmin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre Completo</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Juan Pérez"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                disabled={loading}
              />
              {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@ejemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={loading}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={loading}
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setFormData({ email: '', password: '', fullName: '' });
                  setErrors({});
                  setView('list');
                }}
                disabled={loading}
                className="flex-1"
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Crear Admin
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {view === 'edit' && selectedAdmin && (
          <form onSubmit={handleEditAdmin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editFullName">Nombre Completo</Label>
              <Input
                id="editFullName"
                type="text"
                placeholder="Juan Pérez"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                disabled={loading}
              />
              {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editEmail">Correo Electrónico</Label>
              <Input
                id="editEmail"
                type="email"
                placeholder="admin@ejemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={loading}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              <p className="text-xs text-muted-foreground">
                Nota: Cambiar el email aquí solo actualiza el perfil, no las credenciales de acceso.
              </p>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setFormData({ email: '', password: '', fullName: '' });
                  setErrors({});
                  setSelectedAdmin(null);
                  setView('list');
                }}
                disabled={loading}
                className="flex-1"
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
