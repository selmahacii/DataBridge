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
import { toast } from "sonner";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Agency {
  id: string;
  name: string;
  email: string;
  phone?: string;
  plan: string;
  clientCount: number;
  userCount: number;
}

const planVariant: Record<string, string> = {
  starter:
    "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  professional:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  enterprise:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

interface AgencyFormData {
  name: string;
  email: string;
  phone: string;
  plan: string;
}

const defaultFormData: AgencyFormData = {
  name: "",
  email: "",
  phone: "",
  plan: "starter",
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
    mutationFn: (data: AgencyFormData) => api.createAgency(data as Record<string, unknown>),
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
      api.updateAgency(id, data as Record<string, unknown>),
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
      email: agency.email,
      phone: agency.phone ?? "",
      plan: agency.plan,
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {agencies.map((agency: Agency) => (
            <Card key={agency.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{agency.name}</CardTitle>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                      planVariant[agency.plan] ?? planVariant.starter
                    )}
                  >
                    {agency.plan}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>{agency.email}</p>
                  {agency.phone && <p>{agency.phone}</p>}
                </div>
                <div className="flex items-center gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{agency.clientCount} clients</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{agency.userCount} users</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 justify-end mt-4">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleOpenEdit(agency)}
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
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
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
              <div className="grid gap-2">
                <Label htmlFor="agency-name">Agency Name</Label>
                <Input
                  id="agency-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((d) => ({ ...d, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="agency-email">Email</Label>
                <Input
                  id="agency-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((d) => ({ ...d, email: e.target.value }))
                  }
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
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="agency-plan">Plan</Label>
                <Select
                  value={formData.plan}
                  onValueChange={(v) =>
                    setFormData((d) => ({ ...d, plan: v }))
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
