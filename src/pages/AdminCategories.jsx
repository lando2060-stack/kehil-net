import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Trash2, Pencil, Check, X, Loader2, Shield, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

function CategoryList({ title, entityName, queryKey }) {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: [queryKey],
    queryFn: () => base44.entities[entityName].list('order', 100),
  });

  const createMutation = useMutation({
    mutationFn: () => base44.entities[entityName].create({ name: newName.trim(), order: categories.length + 1 }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [queryKey] }); setNewName(''); toast.success('הקטגוריה נוספה'); },
  });

  const updateMutation = useMutation({
    mutationFn: (/** @type {{id: string, name: string}} */ { id, name }) => base44.entities[entityName].update(id, { name }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [queryKey] }); setEditingId(null); toast.success('הקטגוריה עודכנה'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (/** @type {string} */ id) => base44.entities[entityName].delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [queryKey] }); setDeleteTarget(null); toast.success('הקטגוריה נמחקה'); },
  });

  const reorderMutation = useMutation({
    mutationFn: async (/** @type {any[]} */ reordered) => {
      await Promise.all(reordered.map((cat, idx) => base44.entities[entityName].update(cat.id, { order: idx + 1 })));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(categories);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    queryClient.setQueryData([queryKey], reordered);
    reorderMutation.mutate(reordered);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId={queryKey}>
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-1">
                  {categories.map((cat, index) => (
                    <Draggable key={cat.id} draggableId={cat.id} index={index}>
                      {(drag) => (
                        <div
                          ref={drag.innerRef}
                          {...drag.draggableProps}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 group bg-background border border-transparent hover:border-border/50"
                        >
                          <span {...drag.dragHandleProps} className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground">
                            <GripVertical className="w-4 h-4" />
                          </span>
                          {editingId === cat.id ? (
                            <>
                              <Input
                                value={editingName}
                                onChange={e => setEditingName(e.target.value)}
                                className="h-7 text-sm flex-1"
                                onKeyDown={e => e.key === 'Enter' && updateMutation.mutate({ id: cat.id, name: editingName })}
                                autoFocus
                              />
                              <button onClick={() => updateMutation.mutate({ id: cat.id, name: editingName })} className="text-green-600 hover:text-green-700">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="flex-1 text-sm">{cat.name}</span>
                              <button
                                onClick={() => { setEditingId(cat.id); setEditingName(cat.name); }}
                                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(cat)}
                                className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-opacity"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}

        {/* Add new */}
        <div className="flex gap-2 pt-2 border-t">
          <Input
            placeholder="שם קטגוריה חדשה..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="h-8 text-sm"
            onKeyDown={e => e.key === 'Enter' && newName.trim() && createMutation.mutate()}
          />
          <Button
            size="sm"
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 h-8 px-3"
            disabled={!newName.trim() || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת קטגוריה</AlertDialogTitle>
            <AlertDialogDescription>
              האם למחוק את הקטגוריה "{deleteTarget?.name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteMutation.mutate(deleteTarget?.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'מחק'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

export default function AdminCategories() {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return (
      <div className="p-10 text-center">
        <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">גישה מוגבלת</h2>
        <p className="text-muted-foreground">רק מנהלים יכולים לנהל קטגוריות</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="w-6 h-6 text-secondary" />
        <div>
          <h1 className="text-2xl font-bold">ניהול קטגוריות</h1>
          <p className="text-sm text-muted-foreground">הוסיפו, ערכו ומחקו קטגוריות עבור תבניות ורקעים</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CategoryList title="קטגוריות תבניות" entityName="TemplateCategory" queryKey="template-categories-admin" />
        <CategoryList title="קטגוריות רקעים" entityName="BackgroundCategory" queryKey="bg-categories-admin" />
      </div>
    </div>
  );
}
