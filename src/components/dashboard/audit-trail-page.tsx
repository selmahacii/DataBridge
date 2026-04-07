"use client";

import { useQuery } from "@tanstack/react-query";
import { 
  Fingerprint, 
  Search, 
  Filter, 
  History, 
  User, 
  Database, 
  GitBranch, 
  Activity, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  ShieldAlert,
  RefreshCw,
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
import { cn } from "@/lib/utils";

const auditLogs = [
  { id: "at-94821", action: "Pipeline Config Update", user: "Selma Haci", target: "Meta Ads V2 API", time: "12m ago", status: "Success", details: "Changed sync frequency from 15m to 2m." },
  { id: "at-94820", action: "Data Replay Triggered", user: "Selma Haci", target: "DLQ #ev_12345", time: "25m ago", status: "Pending", details: "Manual replay after schema resolution." },
  { id: "at-94819", action: "Feature Register", user: "Machine Agent #44", target: "Inference Cluster", time: "45m ago", status: "Success", details: "Auto-registered 'is_churn_risk' v1.2" },
  { id: "at-94818", action: "Access Level Change", user: "Admin Dev", target: "User: John Doe", time: "1h ago", status: "Alert", details: "Elevated to Agency Administrator" },
  { id: "at-94817", action: "Emergency Stop", user: "Systems Watchdog", target: "GA4 Stream", time: "2h ago", status: "Success", details: "Circuit breaker opened due to latency spike." },
  { id: "at-94816", action: "Report Dispatch", user: "Temporal Orchestrator", target: "Strategic Clients", time: "4h ago", status: "Success", details: "Generated 142 PDF intelligence reports." },
];

export function AuditTrailPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <Fingerprint className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Full Event Lineage</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight tracking-tighter">System Audit Trail</h1>
          <p className="text-muted-foreground text-sm font-medium">Immutable record of all platform operations, data flows, and configuration changes.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 font-bold px-4 border-border/50">
             DOWNLOAD EVIDENCE
          </Button>
          <Button size="sm" className="h-9 font-bold bg-primary shadow-lg shadow-primary/20 px-6">
             VERIFY INTEGRITY
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-border/50 bg-background/50 backdrop-blur-xl">
           <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Log Density (24h)</CardTitle>
           </CardHeader>
           <CardContent>
              <div className="flex items-end justify-between">
                <span className="text-4xl font-black tabular-nums">4,821</span>
                <span className="text-green-500 text-[10px] font-bold flex items-center mb-1">
                   <Activity className="h-3 w-3 mr-1" />
                   HEALTHY
                </span>
              </div>
           </CardContent>
        </Card>
        <Card className="border-border/50 bg-background/50 backdrop-blur-xl">
           <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Active Sessions</CardTitle>
           </CardHeader>
           <CardContent>
              <div className="flex items-end justify-between">
                <span className="text-4xl font-black tabular-nums">12</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-50 tracking-widest mb-1">Verified Agents</span>
              </div>
           </CardContent>
        </Card>
        <Card className="border-border/50 bg-background/50 backdrop-blur-xl border-amber-500/10">
           <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Compliance Alerts</CardTitle>
           </CardHeader>
           <CardContent>
              <div className="flex items-end justify-between">
                <span className="text-4xl font-black tabular-nums">2</span>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] font-bold mb-1">REQUIRES REVIEW</Badge>
              </div>
           </CardContent>
        </Card>
        <Card className="border-border/50 bg-background/50 backdrop-blur-xl">
           <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Verification Status</CardTitle>
           </CardHeader>
           <CardContent>
              <div className="flex items-end justify-between">
                <span className="text-4xl font-black tabular-nums">100%</span>
                <ShieldCheck className="h-5 w-5 text-green-500 mb-1" />
              </div>
           </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-xl">
        <div className="p-6 border-b border-border/40 flex items-center justify-between bg-muted/10">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
              <Input placeholder="Filter by user, action ID, or target system..." className="pl-9 h-9 text-xs border-border/50 bg-background/50 rounded-lg" />
            </div>
          </div>
          <Button variant="outline" size="sm" className="h-9 font-bold px-4 border-border/50">
             <Filter className="mr-2 h-3 w-3 " /> ALL EVENTS
          </Button>
        </div>
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-border/40">
              <TableHead className="font-bold text-[10px] uppercase tracking-widest px-8 py-4">Action ID</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest py-4">Principal</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest py-4">Operation</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest py-4">Target / Entity</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest py-4">Status</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest py-4">Timeline</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest text-right px-8 py-4"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogs.map((log, i) => (
              <TableRow key={i} className="hover:bg-accent/30 border-border/20 group transition-all cursor-pointer">
                <TableCell className="px-8 py-5">
                   <span className="font-mono text-[10px] font-bold text-muted-foreground">{log.id}</span>
                </TableCell>
                <TableCell>
                   <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                         <User className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-xs font-bold">{log.user}</span>
                   </div>
                </TableCell>
                <TableCell>
                   <span className="text-xs font-black tracking-tight">{log.action}</span>
                </TableCell>
                <TableCell>
                   <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tighter bg-muted/20 border-border/50">{log.target}</Badge>
                </TableCell>
                <TableCell>
                   <div className="flex items-center gap-2">
                       {log.status === 'Success' ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : 
                        log.status === 'Alert' ? <ShieldAlert className="h-3 w-3 text-destructive" /> : 
                        <RefreshCw className="h-3 w-3 text-amber-500 animate-spin-slow" />}
                       <span className={cn(
                         "text-[10px] font-black uppercase tracking-widest",
                         log.status === 'Success' ? "text-green-500" : log.status === 'Alert' ? "text-destructive" : "text-amber-500"
                       )}>{log.status}</span>
                   </div>
                </TableCell>
                <TableCell>
                   <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/60 italic">
                      <Clock className="h-3 w-3" />
                      {log.time}
                   </div>
                </TableCell>
                <TableCell className="px-8 text-right">
                   <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                       <Button variant="ghost" size="icon-xs"><ExternalLink className="h-3.5 w-3.5" /></Button>
                       <Button variant="ghost" size="icon-xs"><MoreVertical className="h-3.5 w-3.5" /></Button>
                   </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="p-4 border-t border-border/30 flex items-center justify-between">
           <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic flex items-center gap-1.5 px-4">
             <ShieldCheck className="h-3 w-3 text-primary" /> Global Blockchain Hash: 0x4f2d...a931 (Verified)
           </span>
           <div className="flex gap-2">
             <Button variant="outline" size="icon" className="h-8 w-8 border-border/50"><ChevronLeft className="h-4 w-4" /></Button>
             <Button variant="outline" size="icon" className="h-8 w-8 border-border/50"><ChevronRight className="h-4 w-4" /></Button>
           </div>
        </div>
      </Card>
      
      <div className="grid gap-6 md:grid-cols-2">
         <Card className="border-border/50 bg-background/50 backdrop-blur-xl">
            <CardHeader className="pb-4 border-b border-border/40">
               <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground/70">Top Principals</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
               <div className="space-y-6">
                  {[
                    { name: 'Selma Haci', actions: 242, color: 'bg-primary' },
                    { name: 'Temporal Worker #1', actions: 1205, color: 'bg-blue-500' },
                    { name: 'Flink DQ Service', actions: 8421, color: 'bg-amber-500' },
                  ].map((p, i) => (
                    <div key={i} className="space-y-2">
                       <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                          <span className="text-muted-foreground/60">{p.name}</span>
                          <span>{p.actions.toLocaleString()} ops</span>
                       </div>
                       <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", p.color)} style={{width: `${(p.actions / 8421) * 100}%`}} />
                       </div>
                    </div>
                  ))}
               </div>
            </CardContent>
         </Card>
         <Card className="border-border/50 bg-background/50 backdrop-blur-xl">
            <CardHeader className="pb-4 border-b border-border/40">
               <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground/70">Operation Types</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <div className="space-y-6">
                  {[
                    { name: 'Configuration', count: 42, color: 'bg-purple-500' },
                    { name: 'Data Replay', count: 18, color: 'bg-amber-500' },
                    { name: 'System Access', count: 156, color: 'bg-green-500' },
                  ].map((p, i) => (
                    <div key={i} className="space-y-2">
                       <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                          <span className="text-muted-foreground/60">{p.name}</span>
                          <span>{p.count} ops</span>
                       </div>
                       <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", p.color)} style={{width: `${(p.count / 156) * 100}%`}} />
                       </div>
                    </div>
                  ))}
               </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
