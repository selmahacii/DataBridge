"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Users, Building } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Agency {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  address?: string;
  plan: string;
  maxClients: number;
  _count?: {
    clients: number;
    users: number;
  };
}

const planVariant: Record<string, string> = {
  starter: "bg-stone-50 text-stone-600 border-stone-200 dark:bg-stone-900/40 dark:text-stone-400 dark:border-stone-800",
  professional: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800",
  enterprise: "bg-zinc-100 text-zinc-900 border-zinc-300 dark:bg-zinc-800/80 dark:text-zinc-100 dark:border-zinc-700",
};

interface AgencyFormData {
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  plan: string;
  maxClients: number;
}

const defaultFormData: AgencyFormData = {
  name: "",
  slug: "",
  email: "",
  phone: "",
  address: "",
  plan: "professional",
  maxClients: 10,
};

export function AgenciesPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Agency | null>(null);
  const [formData, setFormData] = useState<AgencyFormData>(defaultFormData);
  const [isEditing, setIsEditing] = useState(false);

  const { data: agencies = [], isLoading } = useQuery({
    queryKey: ["agencies"],
    queryFn: () => api.getAgencies() as Promise<Agency[]>,
  });

  const createMutation = useMutation({
    mutationFn: (data: AgencyFormData) => api.createAgency(data as unknown as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agencies"] });
      setOpen(false);
      setFormData(defaultFormData);
      toast.success("Agency created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AgencyFormData }) =>
      api.updateAgency(id, data as unknown as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agencies"] });
      setOpen(false);
      setSelected(null);
      setFormData(defaultFormData);
      setIsEditing(false);
      toast.success("Agency updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteAgency(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agencies"] });
      setDeleteOpen(false);
      setSelected(null);
      toast.success("Agency deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  function handleOpenCreate() {
    setFormData(defaultFormData);
    setSelected(null);
    setIsEditing(false);
    setOpen(true);
  }

  function handleOpenEdit(agency: Agency) {
    setSelected(agency);
    setFormData({
      name: agency.name,
      slug: agency.slug,
      email: agency.email,
      phone: agency.phone ?? "",
      address: agency.address ?? "",
      plan: agency.plan,
      maxClients: agency.maxClients,
    });
    setIsEditing(true);
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isEditing && selected) {
      updateMutation.mutate({ id: selected.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agencies</h1>
          <p className="text-muted-foreground">
            Manage agency accounts and plans
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Agency
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : agencies.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground py-8">
              No agencies found. Add your first agency.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {agencies.map((agency: Agency) => {
            const clientCount = agency._count?.clients ?? 0;
            const userCount = agency._count?.users ?? 0;
            const clientUsage = (clientCount / agency.maxClients) * 100;
            
            return (
              <Card key={agency.id} className="overflow-hidden border-border/50 hover:shadow-lg transition-all duration-300 group">
                <div className={cn(
                  "h-1.5 w-full",
                  agency.plan === 'enterprise' ? "bg-purple-500" : 
                  agency.plan === 'professional' ? "bg-blue-500" : "bg-slate-500"
                )} />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-bold">{agency.name}</CardTitle>
                      <p className="text-xs font-mono text-muted-foreground">ID: {agency.slug}</p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        planVariant[agency.plan] ?? planVariant.starter
                      )}
                    >
                      {agency.plan}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="h-7 w-7 rounded-full bg-primary/5 flex items-center justify-center shrink-0">
                        <Building className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="truncate">{agency.email}</span>
                    </div>
                    {agency.address && (
                      <p className="text-xs text-muted-foreground/70 pl-9 line-clamp-1">{agency.address}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Clients</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold">{clientCount}</span>
                        <span className="text-xs text-muted-foreground">/ {agency.maxClients}</span>
                      </div>
                      <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all",
                            clientUsage > 90 ? "bg-destructive" : clientUsage > 70 ? "bg-amber-500" : "bg-primary"
                          )} 
                          style={{ width: `${Math.min(100, clientUsage)}%` }} 
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Team</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold">{userCount}</span>
                        <Users className="h-4 w-4 text-muted-foreground/50" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 justify-end pt-4 border-t border-border/30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleOpenEdit(agency)}
                      className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => {
                        setSelected(agency);
                        setDeleteOpen(true);
                      }}
                      className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Agency" : "Add Agency"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the agency information."
                : "Register a new agency on the platform."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="agency-name">Agency Name</Label>
                  <Input
                    id="agency-name"
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData((d) => ({ 
                        ...d, 
                        name,
                        slug: isEditing ? d.slug : name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '')
                      }))
                    }}
                    placeholder="e.g. Nexus Digital"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="agency-slug">System Slug</Label>
                  <Input
                    id="agency-slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData((d) => ({ ...d, slug: e.target.value }))
                    }
                    placeholder="nexus-digital"
                    disabled={isEditing}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="agency-email">Email</Label>
                  <Input
                    id="agency-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((d) => ({ ...d, email: e.target.value }))
                    }
                    placeholder="contact@agency.com"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="agency-phone">Phone</Label>
                  <Input
                    id="agency-phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((d) => ({ ...d, phone: e.target.value }))
                    }
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="agency-address">Headquarters Address</Label>
                <Input
                  id="agency-address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData((d) => ({ ...d, address: e.target.value }))
                  }
                  placeholder="Street, City, Country"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="agency-plan">Membership Plan</Label>
                  <Select
                    value={formData.plan}
                    onValueChange={(v) =>
                      setFormData((d) => ({ ...d, plan: v as string }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="agency-max">Client Limit</Label>
                  <Input
                    id="agency-max"
                    type="number"
                    value={formData.maxClients}
                    onChange={(e) =>
                      setFormData((d) => ({ ...d, maxClients: parseInt(e.target.value) }))
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : isEditing
                  ? "Update Agency"
                  : "Create Agency"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agency</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selected?.name}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selected && deleteMutation.mutate(selected.id)}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
