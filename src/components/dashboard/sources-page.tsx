"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Trash2,
  KeyRound,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface Source {
  id: string;
  name: string;
  type: string;
  clientId?: string;
  clientName?: string;
  platform: string;
  status: string;
  lastSync?: string;
  syncFrequency: string;
}

const PLATFORM_OPTIONS: Record<string, { label: string; group: string }> = {
  google_analytics: { label: "Google Analytics 4 (GA4)", group: "Google" },
  google_ads: { label: "Google Ads", group: "Google" },
  facebook_ads: { label: "Meta Ads (Facebook / Instagram)", group: "Meta" },
  linkedin: { label: "LinkedIn Campaign Manager", group: "LinkedIn" },
  csv_import: { label: "CSV / File Import", group: "Manual" },
};

const typeVariant: Record<string, string> = {
  google_analytics: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  facebook_ads: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  google_ads: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  linkedin: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
  csv_import: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

const statusConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  active: {
    label: "Active",
    icon: Wifi,
    className: "text-green-600 dark:text-green-400",
  },
  inactive: {
    label: "Inactive",
    icon: WifiOff,
    className: "text-amber-600 dark:text-amber-400",
  },
  error: {
    label: "Error",
    icon: AlertCircle,
    className: "text-red-600 dark:text-red-400",
  },
  pending: {
    label: "Pending",
    icon: RefreshCw,
    className: "text-muted-foreground",
  },
};

interface SourceFormData {
  name: string;
  type: string;
  clientId: string;
  platform: string;
  syncFrequency: string;
  accountId: string;
}

const defaultFormData: SourceFormData = {
  name: "",
  type: "",
  clientId: "",
  platform: "",
  syncFrequency: "daily",
  accountId: "",
};

export function SourcesPage() {
  const { selectedClientId } = useAppStore();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Source | null>(null);
  const [formData, setFormData] = useState<SourceFormData>(defaultFormData);
  const [isEditing, setIsEditing] = useState(false);

  const { data: sources = [], isLoading } = useQuery({
    queryKey: ["sources", selectedClientId],
    queryFn: () => api.getSources(selectedClientId) as Promise<Source[]>,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-select"],
    queryFn: () =>
      api.getClients() as Promise<Array<{ id: string; name: string }>>,
  });

  const createMutation = useMutation({
    mutationFn: (data: SourceFormData) =>
      api.createSource(data as unknown as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sources"] });
      setOpen(false);
      setFormData(defaultFormData);
      toast.success("Data source connected successfully");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SourceFormData }) =>
      api.updateSource(id, data as unknown as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sources"] });
      setOpen(false);
      setSelected(null);
      setFormData(defaultFormData);
      setIsEditing(false);
      toast.success("Data source updated successfully");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteSource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sources"] });
      setDeleteOpen(false);
      setSelected(null);
      toast.success("Source disconnected");
    },
    onError: (error: Error) => toast.error(error.message),
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
      syncFrequency: source.syncFrequency,
      accountId: "",
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

  const activeCount = sources.filter((s: Source) => s.status === "active").length;
  const errorCount = sources.filter((s: Source) => s.status === "error").length;

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Edge Connectors Active</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Integration Hub</h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">
            Manage high-fidelity data streams from GA4, Meta, and major ad networks.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="h-10 px-6 shadow-md hover:shadow-lg transition-all group">
          <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform" />
          Establish Connection
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary/70">
              Active Streams
            </CardDescription>
            <CardTitle className="text-3xl font-bold">{sources.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1.5 text-[10px] font-medium">
              <span className="text-green-500 font-bold">{activeCount} Healthy</span>
              <span className="text-muted-foreground/50">·</span>
              <span className={cn(errorCount > 0 ? "text-destructive font-bold" : "text-muted-foreground")}>{errorCount} Degraded</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-background/40 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70">
              Flow Velocity
            </CardDescription>
            <CardTitle className="text-3xl font-bold">12.4k/m</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] text-muted-foreground font-medium">Avg events per minute</p>
          </CardContent>
        </Card>

        <Card className="bg-background/40 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70">
              Ingress Volume
            </CardDescription>
            <CardTitle className="text-3xl font-bold">4.2M</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] text-green-500 font-bold">+38% <span className="text-muted-foreground font-medium">vs prev. month</span></p>
          </CardContent>
        </Card>

        <Card className="bg-background/40 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70">
              Service Latency
            </CardDescription>
            <CardTitle className="text-3xl font-bold">142ms</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] text-muted-foreground font-medium">Global API response time</p>
          </CardContent>
        </Card>
      </div>

      {/* Sources Table */}
      <Card>
        <CardHeader className="border-b border-border pb-3">
          <CardTitle>Connected Sources</CardTitle>
          <CardDescription>
            Live synchronization status. OAuth tokens auto-refreshed by the DataBridge engine.
          </CardDescription>
        </CardHeader>
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
                    <TableHead>Source Name</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Sync</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>OAuth</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sources.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-12 text-muted-foreground"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <WifiOff className="h-8 w-8 opacity-30" />
                          <p className="font-medium">No sources connected yet</p>
                          <p className="text-xs">Click &quot;Connect Source&quot; to add GA4, Meta Ads, or Google Ads.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sources.map((source: Source) => {
                      const status = statusConfig[source.status] ?? statusConfig.inactive;
                      const StatusIcon = status.icon;
                      const isOAuth = !["csv_import"].includes(source.type);
                      return (
                        <TableRow key={source.id}>
                          <TableCell className="font-medium">{source.name}</TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                typeVariant[source.type] ?? "bg-secondary text-secondary-foreground"
                              )}
                            >
                              {PLATFORM_OPTIONS[source.type]?.label ?? source.type.replace(/_/g, " ")}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {source.clientName ?? "—"}
                          </TableCell>
                          <TableCell>
                            <div className={cn("flex items-center gap-1.5 text-sm", status.className)}>
                              <StatusIcon className="h-3.5 w-3.5" />
                              <span>{status.label}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {source.lastSync
                              ? new Date(source.lastSync).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Never"}
                          </TableCell>
                          <TableCell className="capitalize text-sm">{source.syncFrequency}</TableCell>
                          <TableCell>
                            {isOAuth ? (
                              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                <KeyRound className="h-3 w-3" />
                                <span className="font-medium">Active</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">N/A</span>
                            )}
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
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => handleOpenDelete(source)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Connect / Edit Source Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Data Source" : "Connect Data Source"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the configuration for this data source connection."
                : "Connect a marketing platform to start pulling data into your ETL pipelines."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-2">
              {/* Platform picker */}
              <div className="space-y-1.5">
                <Label htmlFor="source-type">Platform</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) =>
                    setFormData((d) => ({ ...d, type: v ?? "", platform: v ?? "" }))
                  }
                >
                  <SelectTrigger id="source-type">
                    <SelectValue placeholder="Choose a platform…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Google</SelectLabel>
                      <SelectItem value="google_analytics">Google Analytics 4 (GA4)</SelectItem>
                      <SelectItem value="google_ads">Google Ads</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Meta</SelectLabel>
                      <SelectItem value="facebook_ads">Meta Ads (Facebook / Instagram)</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>LinkedIn</SelectLabel>
                      <SelectItem value="linkedin">LinkedIn Campaign Manager</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Manual</SelectLabel>
                      <SelectItem value="csv_import">CSV / File Import</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Connection name */}
              <div className="space-y-1.5">
                <Label htmlFor="source-name">Connection Label</Label>
                <Input
                  id="source-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((d) => ({ ...d, name: e.target.value }))
                  }
                  placeholder="e.g. Nexus Digital — GA4 Main"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  A descriptive internal label to identify this connection.
                </p>
              </div>

              {/* Account ID */}
              {formData.type && formData.type !== "csv_import" && (
                <div className="space-y-1.5">
                  <Label htmlFor="source-account-id">
                    {formData.type === "google_analytics"
                      ? "GA4 Property ID"
                      : formData.type === "google_ads"
                      ? "Google Ads Customer ID"
                      : formData.type === "facebook_ads"
                      ? "Meta Ad Account ID (act_xxxxx)"
                      : "LinkedIn Account ID"}
                  </Label>
                  <Input
                    id="source-account-id"
                    value={formData.accountId}
                    onChange={(e) =>
                      setFormData((d) => ({ ...d, accountId: e.target.value }))
                    }
                    placeholder={
                      formData.type === "google_analytics"
                        ? "e.g. 123456789"
                        : formData.type === "facebook_ads"
                        ? "e.g. act_123456789"
                        : "Account identifier"
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    OAuth tokens will be requested on save. Tokens are encrypted at rest.
                  </p>
                </div>
              )}

              {/* Client assignment */}
              <div className="space-y-1.5">
                <Label htmlFor="source-client">Assign to Client</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(v) =>
                    setFormData((d) => ({ ...d, clientId: v as string }))
                  }
                >
                  <SelectTrigger id="source-client">
                    <SelectValue placeholder="Select client…" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client: { id: string; name: string }) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sync frequency */}
              <div className="space-y-1.5">
                <Label htmlFor="source-frequency">Sync Frequency</Label>
                <Select
                  value={formData.syncFrequency}
                  onValueChange={(v) =>
                    setFormData((d) => ({ ...d, syncFrequency: v as string }))
                  }
                >
                  <SelectTrigger id="source-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly — best for ad spend monitoring</SelectItem>
                    <SelectItem value="daily">Daily — recommended for most analytics</SelectItem>
                    <SelectItem value="weekly">Weekly — lightweight reporting cadence</SelectItem>
                    <SelectItem value="monthly">Monthly — executive summary reports</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="mt-4">
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
                  ? "Saving…"
                  : isEditing
                  ? "Update Source"
                  : "Connect & Authorize"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Data Source</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect &quot;{selected?.name}&quot;? This will
              stop all ETL syncs and revoke the OAuth token. Existing data points
              in the database will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selected && deleteMutation.mutate(selected.id)}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
