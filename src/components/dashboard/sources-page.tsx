"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

interface Source {
  id: string;
  name: string;
  type: string;
  clientId?: string;
  clientName?: string;
  platform: string;
  status: string;
  lastSync?: string;
  frequency: string;
}

const typeVariant: Record<string, string> = {
  google_analytics:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  facebook_ads:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  google_ads:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  linkedin:
    "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
  csv_import:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

const statusVariant: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  inactive: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  pending: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

interface SourceFormData {
  name: string;
  type: string;
  clientId: string;
  platform: string;
  frequency: string;
}

const defaultFormData: SourceFormData = {
  name: "",
  type: "",
  clientId: "",
  platform: "",
  frequency: "daily",
};

export function SourcesPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Source | null>(null);
  const [formData, setFormData] = useState<SourceFormData>(defaultFormData);
  const [isEditing, setIsEditing] = useState(false);

  const { data: sources = [], isLoading } = useQuery({
    queryKey: ["sources"],
    queryFn: () => api.getSources() as Promise<Source[]>,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-select"],
    queryFn: () =>
      api.getClients() as Promise<Array<{ id: string; name: string }>>,
  });

  const createMutation = useMutation({
    mutationFn: (data: SourceFormData) => api.createSource(data as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sources"] });
      setOpen(false);
      setFormData(defaultFormData);
      toast.success("Data source created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SourceFormData }) =>
      api.updateSource(id, data as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sources"] });
      setOpen(false);
      setSelected(null);
      setFormData(defaultFormData);
      setIsEditing(false);
      toast.success("Data source updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteSource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sources"] });
      setDeleteOpen(false);
      setSelected(null);
      toast.success("Data source deleted successfully");
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

  function handleOpenEdit(source: Source) {
    setSelected(source);
    setFormData({
      name: source.name,
      type: source.type,
      clientId: source.clientId ?? "",
      platform: source.platform,
      frequency: source.frequency,
    });
    setIsEditing(true);
    setOpen(true);
  }

  function handleOpenDelete(source: Source) {
    setSelected(source);
    setDeleteOpen(true);
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
          <h1 className="text-2xl font-bold tracking-tight">Data Sources</h1>
          <p className="text-muted-foreground">
            Connect and manage your data sources
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Source
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Sync</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sources.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No data sources found
                      </TableCell>
                    </TableRow>
                  ) : (
                    sources.map((source: Source) => (
                      <TableRow key={source.id}>
                        <TableCell className="font-medium">
                          {source.name}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                              typeVariant[source.type] ?? ""
                            )}
                          >
                            {source.type.replace(/_/g, " ")}
                          </span>
                        </TableCell>
                        <TableCell>{source.clientName ?? "-"}</TableCell>
                        <TableCell>{source.platform}</TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                              statusVariant[source.status] ?? ""
                            )}
                          >
                            {source.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {source.lastSync
                            ? new Date(source.lastSync).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell className="capitalize">
                          {source.frequency}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => handleOpenEdit(source)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              className="bg-destructive text-white hover:bg-destructive/90"
                              size="icon-xs"
                              onClick={() => handleOpenDelete(source)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Data Source" : "Add Data Source"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the data source configuration."
                : "Configure a new data source connection."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="source-name">Name</Label>
                <Input
                  id="source-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((d) => ({ ...d, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="source-type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) =>
                    setFormData((d) => ({ ...d, type: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google_analytics">
                      Google Analytics
                    </SelectItem>
                    <SelectItem value="facebook_ads">Facebook Ads</SelectItem>
                    <SelectItem value="google_ads">Google Ads</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="csv_import">CSV Import</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="source-client">Client</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(v) =>
                    setFormData((d) => ({ ...d, clientId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(
                      (client: { id: string; name: string }) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="source-platform">Platform</Label>
                <Input
                  id="source-platform"
                  value={formData.platform}
                  onChange={(e) =>
                    setFormData((d) => ({ ...d, platform: e.target.value }))
                  }
                  placeholder="e.g., Google, Facebook"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="source-frequency">Sync Frequency</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(v) =>
                    setFormData((d) => ({ ...d, frequency: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
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
                disabled={
                  createMutation.isPending || updateMutation.isPending
                }
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : isEditing
                  ? "Update Source"
                  : "Create Source"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Data Source</AlertDialogTitle>
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
