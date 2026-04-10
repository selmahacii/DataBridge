"use client";

import { useQuery } from "@tanstack/react-query";
import { 
  BrainCircuit, 
  TrendingUp, 
  Activity, 
  BarChart3, 
  Download, 
  RefreshCw, 
  Target, 
  Zap, 
  Settings, 
  Info,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  PlaySquare,
  HelpCircle,
  ChevronLeft
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  type ChartConfig 
} from "@/components/ui/chart";
import { 
  Area, 
  AreaChart, 
  Bar, 
  BarChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  ResponsiveContainer,
  Tooltip,
  Cell
} from "recharts";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

import { useAppStore } from "@/stores/app-store";

const prophetData = [
  { date: '2026-03-01', actual: 4200, forecast: 4150, lower: 3800, upper: 4500 },
  { date: '2026-03-08', actual: 4500, forecast: 4400, lower: 4100, upper: 4700 },
  { date: '2026-03-15', actual: 4100, forecast: 4300, lower: 3900, upper: 4700 },
  { date: '2026-03-22', actual: 4800, forecast: 4600, lower: 4200, upper: 5000 },
  { date: '2026-03-29', actual: 5200, forecast: 5000, lower: 4600, upper: 5400 },
  { date: '2026-04-05', actual: null, forecast: 5500, lower: 5100, upper: 5900 },
  { date: '2026-04-12', actual: null, forecast: 5800, lower: 5300, upper: 6300 },
  { date: '2026-04-19', actual: null, forecast: 6100, lower: 5500, upper: 6700 },
];

const shapData = [
  { feature: 'Attributed CLV Alpha', impact: 0.45, color: 'text-primary' },
  { feature: 'Ingress Session Density', impact: 0.32, color: 'text-primary' },
  { feature: 'Strategic Channel Weight', impact: 0.18, color: 'text-primary' },
  { feature: 'Inbound Intent Delta', impact: 0.12, color: 'text-primary' },
  { feature: 'Geospatial Context', impact: -0.05, color: 'text-destructive' },
  { feature: 'Handshake Device Cluster', impact: -0.08, color: 'text-destructive' },
];

export function InferenceResultsPage() {
  const { setCurrentPage } = useAppStore();
  const [isInferencing, setIsInferencing] = useState(false);

  const runFullInference = () => {
    setIsInferencing(true);
    toast.promise(new Promise(resolve => setTimeout(resolve, 3000)), {
      loading: 'Orchestrating high-performance compute for predictive models...',
      success: 'Global analytical cycle complete. Signals updated.',
      error: 'Model execution failure. Check logs.',
    });
    setTimeout(() => setIsInferencing(false), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary cursor-pointer hover:opacity-70 transition-all" onClick={() => setCurrentPage("dashboard")}>
            <ChevronLeft className="h-3 w-3" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Back to Performance Overview</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight tracking-tighter">Predictive Outcomes</h1>
          <p className="text-muted-foreground text-sm font-medium">Strategic modeling outputs via Meta Prophet & SHAP feature contribution analysis.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 font-bold px-4 border-border/50" onClick={() => toast.info("Opening Intelligence Temporal Filter...")}>
            <Calendar className="mr-2 h-4 w-4" />
            LAST 30 DAYS
          </Button>
          <Button 
            size="sm" 
            className={cn("h-9 font-bold px-6 bg-primary", isInferencing && "opacity-50")}
            onClick={runFullInference}
            disabled={isInferencing}
          >
            <Zap className={cn("mr-2 h-4 w-4", isInferencing && "animate-pulse")} />
            {isInferencing ? "EXECUTING MODELS..." : "RUN FULL PREDICTIVE CYCLE"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/50 bg-background/50 backdrop-blur-xl">
           <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 px-8 pb-4">
              <div>
                <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground/70">Conversion Probability Forecast</CardTitle>
                <div className="flex items-center gap-4 mt-1.5">
                   <div className="flex items-center gap-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">Actual</span>
                   </div>
                   <div className="flex items-center gap-1">
                      <div className="h-1.5 w-1.5 rounded-full border border-primary/40 bg-primary/10" />
                      <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">Forecast (Prophet)</span>
                   </div>
                   <div className="flex items-center gap-1">
                      <div className="h-1.5 w-4 bg-primary/10" />
                      <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">95% Confidence Band</span>
                   </div>
                </div>
              </div>
              <Badge variant="secondary" className="bg-primary/5 text-primary text-[10px] h-6 font-bold flex items-center gap-1.5 px-3">
                 <Activity className="h-3 w-3" />
                 98.2% MODEL ACCURACY
              </Badge>
           </CardHeader>
           <CardContent className="p-8">
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={prophetData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                    <XAxis 
                       dataKey="date" 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{fontSize: 10, fontWeight: 700, fill: '#666'}} 
                       tickFormatter={(str) => new Date(str).toLocaleDateString([], {month: 'short', day: 'numeric'})}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#666'}} />
                    <Tooltip content={() => null} />
                    
                    <Area 
                       type="monotone" 
                       dataKey="upper" 
                       stroke="none" 
                       fill="oklch(0.627 0.265 303.891)" 
                       fillOpacity={0.05} 
                    />
                    <Area 
                       type="monotone" 
                       dataKey="lower" 
                       stroke="none" 
                       fill="oklch(0.627 0.265 303.891)" 
                       fillOpacity={0.05} 
                    />
                    
                    <Area 
                       type="monotone" 
                       dataKey="forecast" 
                       stroke="oklch(0.627 0.265 303.891)" 
                       strokeWidth={2} 
                       strokeDasharray="5 5"
                       fill="none" 
                    />
                    
                    <Area 
                       type="monotone" 
                       dataKey="actual" 
                       stroke="oklch(0.627 0.265 303.891)" 
                       strokeWidth={4} 
                       fill="url(#forecastGradient)" 
                    />
                    
                    <defs>
                      <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.627 0.265 303.891)" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="oklch(0.627 0.265 303.891)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
           </CardContent>
        </Card>

        <Card className="border-border/50 bg-background/50 backdrop-blur-xl group overflow-hidden">
           <CardHeader className="border-b border-border/40 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground/70">SHAP Feature Importance</CardTitle>
                <HelpCircle className="h-4 w-4 text-muted-foreground/30 ring-1 ring-muted-foreground/10 rounded-full cursor-help hover:text-primary transition-colors" onClick={() => toast.info("SHAP (SHapley Additive exPlanations) uses game theory to determine feature contribution.")} />
              </div>
              <p className="text-[10px] font-bold text-muted-foreground italic mt-1.5">Contribution magnitude of each signal to total model output</p>
           </CardHeader>
           <CardContent className="p-8">
              <div className="h-[430px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={shapData} layout="vertical" margin={{ left: -10, right: 30 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="feature" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#999'}} width={120} />
                      <Tooltip content={() => null} />
                      <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                         {shapData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.impact > 0 ? 'oklch(0.627 0.265 303.891)' : 'rgb(220, 38, 38, 0.5)'} />
                         ))}
                      </Bar>
                   </BarChart>
                </ResponsiveContainer>
                
                <div className="mt-8 space-y-4">
                   <div className="p-4 rounded-xl border border-border/40 bg-muted/20 flex items-start gap-4 transition-all group-hover:border-primary/20 group-hover:bg-primary/5">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                         <Target className="h-4 w-4" />
                      </div>
                      <div>
                         <p className="text-xs font-bold">Primary Growth Alpha</p>
                         <p className="text-[10px] text-muted-foreground font-medium line-clamp-2">Predicted CLV remains the strongest positive signal for revenue accuracy across all tested nodes.</p>
                      </div>
                   </div>
                </div>
              </div>
           </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
         <Card className="border-border/50 bg-background/50 backdrop-blur-xl group overflow-hidden border-l-4 border-l-primary/50">
            <CardHeader className="pb-2">
               <div className="flex items-center gap-2 mb-2">
                  <BrainCircuit className="h-4 w-4 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Model Signature</span>
               </div>
               <CardTitle className="text-sm font-bold">Meta Prophet v1.2</CardTitle>
            </CardHeader>
            <CardContent>
               <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">
                  Additive regressive model optimized for time-series with non-linear trends and seasonal holiday effects. 
                  Hyperparameters automatically tuned via Bayesian optimization.
               </p>
            </CardContent>
         </Card>

         <Card className="border-border/50 bg-background/50 backdrop-blur-xl group overflow-hidden border-l-4 border-l-amber-500/50">
            <CardHeader className="pb-2">
               <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-amber-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Uncertainty</span>
               </div>
               <CardTitle className="text-sm font-bold">95% Confidence</CardTitle>
            </CardHeader>
            <CardContent>
               <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">
                  Intervals computed using MCMC (Markov Chain Monte Carlo) sampling. Current MAP estimate (Maximum A Posteriori) targets 30-day forward growth velocity.
               </p>
            </CardContent>
         </Card>

         <Card className="border-border/50 bg-background/50 backdrop-blur-xl group overflow-hidden border-l-4 border-l-purple-500/50">
            <CardHeader className="pb-2">
               <div className="flex items-center gap-2 mb-2">
                  <RefreshCw className="h-4 w-4 text-purple-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-purple-500">Explanation Domain</span>
               </div>
               <CardTitle className="text-sm font-bold">TreeSHAP Kernel</CardTitle>
            </CardHeader>
            <CardContent>
               <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">
                  Utilizing Fast TreeSHAP for gradient boosted trees. Local explanations provided for every individual event record in the ClickHouse materialized view.
               </p>
            </CardContent>
         </Card>

         <Card className="border-border/50 bg-background/50 backdrop-blur-xl group overflow-hidden border-l-4 border-l-green-500/50">
            <CardHeader className="pb-2">
               <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Training State</span>
               </div>
               <CardTitle className="text-sm font-bold">Hot-Reload Ready</CardTitle>
            </CardHeader>
            <CardContent>
               <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">
                  Model training occurs every 6h on normalized Flink signals. Delta weights propagated to inference workers via global S3 registry.
               </p>
            </CardContent>
         </Card>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-xl overflow-hidden shadow-2xl">
         <div className="p-8 border-b border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/10">
            <div className="space-y-1">
               <div className="flex items-center gap-2 mb-1">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <h3 className="font-black text-xl tracking-tighter uppercase">Predictive Audit Trace</h3>
               </div>
               <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Detailed attribution trace for the latest model execution epoch.</p>
            </div>
            <div className="flex items-center gap-2">
               <Button variant="outline" size="sm" className="h-10 font-bold px-4 rounded-xl border-border/60 hover:bg-primary/5" onClick={() => toast.info("Synching model weights with global registry...")}>
                  <RefreshCw className="mr-2 h-4 w-4 opacity-70" />
                  SYNC WEIGHTS
               </Button>
                <Button variant="outline" size="sm" className="h-10 font-bold px-4 rounded-xl border-border/60" onClick={() => toast.success("Predictive metrics exported as JSON.")}>
                  <Download className="mr-2 h-4 w-4 opacity-70" />
                  EXPORTS
                </Button>
            </div>
         </div>
         <CardContent className="p-0">
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-muted/30 border-b border-border/40">
                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Execution ID</th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Timestamp</th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Node Origin</th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-center">Data Fidelity</th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-right">Latency</th>
                     </tr>
                  </thead>
                  <tbody>
                     {[
                        { id: "INF-8492-X", ts: "2026-04-07 02:22:01", node: "AWS-EU-CENTRAL-1", fidelity: "99.8%", latency: "142ms", status: "success" },
                        { id: "INF-8491-Y", ts: "2026-04-07 02:15:34", node: "GCP-US-EAST-4", fidelity: "99.4%", latency: "110ms", status: "success" },
                        { id: "INF-8490-Z", ts: "2026-04-07 02:08:12", node: "AWS-EU-CENTRAL-1", fidelity: "88.2%", latency: "254ms", status: "warning" },
                        { id: "INF-8489-A", ts: "2026-04-07 02:01:45", node: "EDGE-LDN-01", fidelity: "99.9%", latency: "42ms", status: "success" },
                     ].map((row, i) => (
                        <tr key={i} className="border-b border-border/10 hover:bg-muted/20 transition-colors group">
                           <td className="px-8 py-4">
                              <span className="font-mono text-[11px] font-bold text-primary group-hover:underline cursor-pointer">{row.id}</span>
                           </td>
                           <td className="px-8 py-4 text-[11px] font-bold opacity-70 italic">{row.ts}</td>
                           <td className="px-8 py-4 text-[11px] font-bold text-muted-foreground">{row.node}</td>
                           <td className="px-8 py-4 text-center">
                              <Badge className={cn(
                                 "text-[9px] font-black px-2 py-0 h-5",
                                 row.status === "success" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                              )}>
                                 {row.fidelity}
                              </Badge>
                           </td>
                           <td className="px-8 py-4 text-right">
                              <span className="text-[11px] font-black tabular-nums opacity-80">{row.latency}</span>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>

            <div className="p-12 bg-muted/5 flex flex-col md:flex-row items-center gap-12 border-t border-border/40">
               <div className="flex-1 space-y-6">
                  <div className="space-y-2">
                     <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                           <PlaySquare className="h-5 w-5 text-primary" />
                        </div>
                        <h4 className="font-black text-2xl tracking-tighter uppercase">Strategic Validation Replay</h4>
                     </div>
                      <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-xl">
                        Validate model calibration by re-simulating the predictive pipeline over historical signal clusters. 
                        Target outcomes are matched against reality to compute **Temporal Deviation Delta**.
                      </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 rounded-2xl bg-background border border-border/40 space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Temporal Window</label>
                        <select className="w-full bg-transparent border-none text-xs font-bold focus:ring-0 cursor-pointer">
                           <option>LAST_7_DAYS_HIGH_FIDELITY</option>
                           <option>CRITICAL_DRIFT_THRESHOLD_4H</option>
                           <option>HISTORICAL_PEAK_Q1_2025</option>
                        </select>
                     </div>
                     <div className="p-4 rounded-2xl bg-background/50 border border-border/40 space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Validation Node</label>
                        <select className="w-full bg-transparent border-none text-xs font-bold focus:ring-0 cursor-pointer">
                           <option>FLINK_K8S_PRIMARY_CLUSTER</option>
                           <option>REDIS_ML_SHADOW_EDGE</option>
                           <option>LOCAL_SANDBOX_RUNTIME</option>
                        </select>
                     </div>
                  </div>
               </div>
               <div className="shrink-0 flex flex-col gap-3 w-full md:w-auto">
                  <Button className="h-14 px-10 font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary text-white" onClick={() => toast.success("Historical back-simulation job submitted to Flink Primary.", {
                     description: "Job ID: BS-0442-99 • Status: Queued (Position 2)",
                     icon: <Activity className="h-4 w-4" />
                  })}>
                     START BACK-TESTING ORCHESTRATION
                  </Button>
                  <Button variant="ghost" className="h-10 font-bold text-xs hover:bg-primary/5 text-muted-foreground" onClick={() => toast.info("Opening Replay Graphing Tool...")}>
                     CONFIGURE TEMPORAL SLICES
                  </Button>
               </div>
            </div>
         </CardContent>
      </Card>

    </div>
  );
}
