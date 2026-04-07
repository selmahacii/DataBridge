import { 
  Plus, 
  Search, 
  Download, 
  LayoutGrid, 
  ChevronLeft, 
  ChevronRight, 
  Info, 
  Clock, 
  ExternalLink, 
  MoreVertical,
  Activity,
  Zap,
  Trash2,
  Copy,
  LineChart,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/stores/app-store";

const initialFeatures = [
  { id: "1", name: "customer_lifetime_value_predicted", type: "Double", updated: "2m ago", cardinality: "342,102", health: 99.8, coverage: 94.5, mode: "batch" },
  { id: "2", name: "avg_daily_sessions_7d", type: "Integer", updated: "15m ago", cardinality: "高 (Continuous)", health: 100, coverage: 100, mode: "batch" },
  { id: "3", name: "preferred_marketing_channel", type: "String", updated: "1h ago", cardinality: "12 (Categorical)", health: 98.4, coverage: 82.3, mode: "real-time" },
  { id: "4", name: "last_conversion_intent_score", type: "Double", updated: "5m ago", cardinality: "1.2M", health: 99.1, coverage: 88.9, mode: "real-time" },
  { id: "5", name: "is_high_churn_risk", type: "Boolean", updated: "30s ago", cardinality: "2 (Binary)", health: 97.2, coverage: 95.1, mode: "batch" },
  { id: "6", name: "engagement_velocity_index", type: "Double", updated: "45m ago", cardinality: "高 (Continuous)", health: 99.9, coverage: 100, mode: "real-time" },
  { id: "7", name: "meta_ads_attribution_weight", type: "Double", updated: "12h ago", cardinality: "高 (Continuous)", health: 94.5, coverage: 74.2, mode: "batch" },
];

export function FeatureStorePage() {
  const { setCurrentPage } = useAppStore();
  const [features, setFeatures] = useState(initialFeatures);
  const [isRegistering, setIsRegistering] = useState(false);
  const [filterMode, setFilterMode] = useState<"batch" | "real-time" | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);

  // Computed features based on search and filters
  const filteredFeatures = useMemo(() => {
    return features.filter(f => {
      const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterMode === "all" || f.mode === filterMode;
      return matchesSearch && matchesFilter;
    });
  }, [features, searchQuery, filterMode]);

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     setIsRegistering(true);
     
     const formData = new FormData(e.currentTarget);
     const name = formData.get("name") as string;
     const type = formData.get("type") as string;
     const mode = formData.get("mode") as string;

     toast.promise(new Promise(resolve => setTimeout(resolve, 1500)), {
       loading: 'Propagating feature metadata to the global registry...',
       success: () => {
         const newFeature = {
           id: Math.random().toString(36).substr(2, 9),
           name: name || "new_feature_signal",
           type: (type?.charAt(0).toUpperCase() + type?.slice(1)) || "Double",
           updated: "Just now",
           cardinality: "0 (Initializing)",
           health: 100,
           coverage: 0,
           mode: mode as "batch" | "real-time"
         };
         setFeatures([newFeature, ...features]);
         setIsRegistering(false);
         setOpen(false);
         return 'Feature successfully registered and available for strategic prediction.';
       },
       error: 'Schema validation failed. Check data types.',
     });
  };

  const handleDelete = (id: string, name: string) => {
    toast.promise(new Promise(resolve => setTimeout(resolve, 800)), {
      loading: `Decommissioning ${name}...`,
      success: () => {
        setFeatures(features.filter(f => f.id !== id));
        return `Feature ${name} removed from registry.`;
      },
      error: 'Failed to delete feature.',
    });
  };

  const handleMaterialize = (name: string) => {
    toast.promise(new Promise(resolve => setTimeout(resolve, 2000)), {
        loading: `Triggering Flink job to re-materialize ${name}...`,
        success: `Materialization complete. Cardinality refreshed.`,
        error: 'Engine timeout. Check Flink cluster health.',
      });
  };

  const handleExport = () => {
     toast.info("Synthesizing Parquet schema for feature export...");
     setTimeout(() => {
        toast.success("Feature schema exported as 'DataBridge_FeatureStore_v2.4.yaml'");
     }, 1000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary cursor-pointer hover:opacity-70 transition-all" onClick={() => setCurrentPage("dashboard")}>
            <ChevronLeft className="h-3 w-3" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Back to Performance Overview</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight tracking-tighter">Strategic Feature Signal Store</h1>
          <p className="text-muted-foreground text-sm font-medium">Unified repository for high-fidelity production features and strategic signals.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 font-bold px-4 border-border/50" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            EXPORT SCHEMA
          </Button>
          
          <Dialog open={open} onOpenChange={setOpen}>
             <DialogTrigger render={<Button className="h-9 font-bold px-6 rounded-md" />}>
                <div className="flex items-center">
                  <Plus className="mr-2 h-4 w-4" />
                  REGISTER FEATURE
                </div>
             </DialogTrigger>
             <DialogContent className="sm:max-w-[425px] border-border/40 bg-background/95 backdrop-blur-3xl rounded-[2rem]">
                <form onSubmit={handleRegister}>
                   <DialogHeader className="space-y-3">
                      <DialogTitle className="text-2xl font-black tracking-tighter text-foreground">Register New Feature</DialogTitle>
                      <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                         Map a high-fidelity signal for analytical ingestion.
                      </DialogDescription>
                   </DialogHeader>
                   <div className="grid gap-6 py-8">
                      <div className="space-y-2">
                         <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest opacity-50">Feature Signature</Label>
                         <Input name="name" id="name" placeholder="eg: customer_loyalty_score" className="h-11 rounded-xl bg-muted/20 border-border/50" required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="type" className="text-[10px] font-black uppercase tracking-widest opacity-50">Value Type</Label>
                            <Select name="type" defaultValue="double">
                               <SelectTrigger id="type" className="h-11 rounded-xl bg-muted/20 border-border/50">
                                  <SelectValue placeholder="Select type" />
                               </SelectTrigger>
                               <SelectContent>
                                  <SelectItem value="double">Double</SelectItem>
                                  <SelectItem value="integer">Integer</SelectItem>
                                  <SelectItem value="string">String</SelectItem>
                                  <SelectItem value="boolean">Boolean</SelectItem>
                               </SelectContent>
                            </Select>
                         </div>
                         <div className="space-y-2">
                            <Label htmlFor="mode" className="text-[10px] font-black uppercase tracking-widest opacity-50">Compute Mode</Label>
                            <Select name="mode" defaultValue="batch">
                               <SelectTrigger id="mode" className="h-11 rounded-xl bg-muted/20 border-border/50">
                                  <SelectValue placeholder="Mode" />
                               </SelectTrigger>
                               <SelectContent>
                                  <SelectItem value="batch">Batch</SelectItem>
                                  <SelectItem value="real-time">Real-time</SelectItem>
                               </SelectContent>
                            </Select>
                         </div>
                      </div>
                      <div className="space-y-2">
                         <Label htmlFor="source" className="text-[10px] font-black uppercase tracking-widest opacity-50">Upstream Context</Label>
                         <Input name="source" id="source" placeholder="Kafka Topic or SQL Table..." className="h-11 rounded-xl bg-muted/20 border-border/50" required />
                      </div>
                   </div>
                   <DialogFooter>
                      <Button type="submit" className="w-full h-11 font-bold rounded-xl transition-all" disabled={isRegistering}>
                         {isRegistering ? "VALIDATING SCHEMA..." : "CONFIRM REGISTRATION"}
                      </Button>
                   </DialogFooter>
                </form>
             </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-border/50 bg-background/50 backdrop-blur-xl">
           <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Total Registered Features</CardTitle>
           </CardHeader>
           <CardContent>
              <div className="flex items-end justify-between">
                <span className="text-4xl font-black tabular-nums">{features.length}</span>
                <Badge variant="secondary" className="text-[10px] font-bold bg-primary/10 text-primary border-primary/20">+1 since start</Badge>
              </div>
           </CardContent>
        </Card>
        <Card className="border-border/50 bg-background/50 backdrop-blur-xl">
           <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Storage Utilization</CardTitle>
           </CardHeader>
           <CardContent>
              <div className="flex items-end justify-between">
                <span className="text-4xl font-black tabular-nums">1.2 TB</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-50 tracking-widest">RocksDB + S3</span>
              </div>
           </CardContent>
        </Card>
        <Card className="border-border/50 bg-background/50 backdrop-blur-xl">
           <CardHeader className="pb-2 text-primary">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-80">Feature Availability</CardTitle>
           </CardHeader>
           <CardContent>
              <div className="flex items-end justify-between">
                <span className="text-4xl font-black tabular-nums">98.4%</span>
                <div className="w-24 h-1 bg-muted rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-primary w-[98%]" />
                </div>
              </div>
           </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-xl overflow-hidden">
        <div className="p-6 border-b border-border/40 flex flex-col sm:flex-row items-center justify-between bg-muted/10 gap-4">
          <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
              <Input 
                placeholder="Search features by name or tag..." 
                className="pl-9 h-10 text-xs border-border/50 bg-background/50 rounded-xl" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1.5 border border-border/50 bg-background/50 rounded-xl px-2 h-10">
               <span className="text-[10px] font-bold text-muted-foreground/60 px-1 border-r border-border/40 uppercase">Filter</span>
               <Button 
                variant={filterMode === "all" ? "secondary" : "ghost"} 
                size="xs" 
                className="h-7 text-[10px] font-bold px-3 transition-colors rounded-lg"
                onClick={() => setFilterMode("all")}
              >
                ALL
              </Button>
               <Button 
                variant={filterMode === "batch" ? "secondary" : "ghost"} 
                size="xs" 
                className="h-7 text-[10px] font-bold px-3 transition-colors rounded-lg"
                onClick={() => setFilterMode("batch")}
              >
                BATCH
              </Button>
               <Button 
                variant={filterMode === "real-time" ? "secondary" : "ghost"} 
                size="xs" 
                className="h-7 text-[10px] font-bold px-3 transition-colors rounded-lg"
                onClick={() => setFilterMode("real-time")}
              >
                REAL-TIME
              </Button>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" onClick={() => toast.info("Toggling grid visualization mode.")}><LayoutGrid className="h-4 w-4 text-muted-foreground" /></Button>
        </div>
        <div className="overflow-x-auto min-h-[400px]">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border/40">
                <TableHead className="font-bold text-[10px] uppercase tracking-widest px-8 py-4">Feature Signature</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Type</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Active Cardinality</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Last Compute</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Coverage</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-right px-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFeatures.length === 0 ? (
                 <TableRow>
                    <TableCell colSpan={6} className="py-20 text-center">
                       <div className="flex flex-col items-center gap-2 opacity-30">
                          <Zap className="h-10 w-10" />
                          <span className="text-xs font-bold uppercase tracking-widest">No matching features found</span>
                       </div>
                    </TableCell>
                 </TableRow>
              ) : (
                filteredFeatures.map((f) => (
                  <TableRow key={f.id} className="hover:bg-accent/30 border-border/20 group transition-all">
                    <TableCell className="px-8 py-5">
                       <div className="flex flex-col gap-0.5">
                          <span className="font-black text-sm tracking-tight text-primary/80 group-hover:text-primary transition-colors cursor-pointer">{f.name}</span>
                          <div className="flex items-center gap-2">
                             <div className={cn("h-1.5 w-1.5 rounded-full", f.health > 98 ? "bg-green-500" : "bg-amber-500")} />
                             <span className="text-[10px] font-bold text-muted-foreground opacity-60">Health: {f.health}% &middot; Mode: <span className="uppercase text-primary/60">{f.mode}</span></span>
                          </div>
                       </div>
                    </TableCell>
                    <TableCell className="text-center">
                       <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tighter px-2 border-primary/20 bg-primary/5 text-primary">{f.type}</Badge>
                    </TableCell>
                    <TableCell>
                       <span className="text-xs font-bold tabular-nums opacity-80">{f.cardinality}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground italic">
                        <Clock className="h-3 w-3" />
                        {f.updated}
                      </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex flex-col gap-1.5 w-24">
                          <span className="text-[10px] font-black italic">{f.coverage}%</span>
                          <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                             <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{width: `${f.coverage}%`}} />
                          </div>
                       </div>
                    </TableCell>
                    <TableCell className="px-8 text-right">
                       <div className="flex justify-end gap-2">
                           <Button 
                            variant="ghost" 
                            size="icon-xs" 
                            className="h-9 w-9 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/10 hover:text-primary"
                            onClick={() => {
                               toast.info(`Opening lineage graph for ${f.name}...`);
                            }}
                          >
                              <ExternalLink className="h-4 w-4" />
                           </Button>
                           
                           <DropdownMenu>
                              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" className="h-9 w-9 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-accent" />}>
                                 <MoreVertical className="h-4 w-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56 rounded-2xl border-border/40 bg-background/95 backdrop-blur-3xl p-2">
                                 <DropdownMenuGroup>
                                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-2 py-2">Signal Actions</DropdownMenuLabel>
                                    <DropdownMenuItem className="rounded-xl px-2 py-2 cursor-pointer gap-2" onClick={() => handleMaterialize(f.name)}>
                                       <RefreshCw className="h-4 w-4 text-primary" />
                                       <span className="text-sm font-bold">Re-materialize</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="rounded-xl px-2 py-2 cursor-pointer gap-2" onClick={() => toast.success(`Feature schema copied to clipboard.`)}>
                                       <Copy className="h-4 w-4" />
                                       <span className="text-sm font-bold">Clone Schema</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="rounded-xl px-2 py-2 cursor-pointer gap-2" onClick={() => toast.info(`Initializing profile analysis for ${f.name}...`)}>
                                       <LineChart className="h-4 w-4" />
                                       <span className="text-sm font-bold">Distribution Profile</span>
                                    </DropdownMenuItem>
                                 </DropdownMenuGroup>
                                 <DropdownMenuSeparator className="bg-border/40 mx-1" />
                                 <DropdownMenuItem className="rounded-xl px-2 py-2 cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleDelete(f.id, f.name)}>
                                    <Trash2 className="h-4 w-4" />
                                    <span className="text-sm font-bold">Decommission</span>
                                 </DropdownMenuItem>
                              </DropdownMenuContent>
                           </DropdownMenu>
                       </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="p-4 border-t border-border/30 flex items-center justify-between bg-muted/5">
           <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic flex items-center gap-1.5">
             <Info className="h-3 w-3" /> Showing {filteredFeatures.length} active production signals from Cluster v2.4
           </span>
           <div className="flex gap-2">
             <Button variant="outline" size="icon" className="h-9 w-9 border-border/50 rounded-xl hover:bg-accent"><ChevronLeft className="h-4 w-4" /></Button>
             <Button variant="outline" size="icon" className="h-9 w-9 border-border/50 rounded-xl hover:bg-accent"><ChevronRight className="h-4 w-4" /></Button>
           </div>
        </div>
      </Card>
    </div>
  );
}
