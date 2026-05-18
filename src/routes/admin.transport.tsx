import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Bus, MapPin, Plus, X, Phone, Users } from "lucide-react";
import { PageHeader, StatCard, Panel, EmptyState } from "@/components/module-shell";
import { useStore, genId } from "@/lib/store";

export const Route = createFileRoute("/admin/transport")({
  head: () => ({ meta: [{ title: "Transport · Campus OS" }] }),
  component: Page,
});

function Page() {
  const { store, dispatch } = useStore();
  const [tab, setTab] = useState<"tracking"|"routes">("tracking");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  // Simulate GPS movement
  const [positions, setPositions] = useState<Record<string, { lat: number; lng: number }>>({});
  useEffect(() => {
    const initial: Record<string, { lat: number; lng: number }> = {};
    store.busRoutes.forEach(r => { initial[r.id] = { lat: r.currentLat, lng: r.currentLng }; });
    setPositions(initial);
    const interval = setInterval(() => {
      setPositions(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(id => {
          next[id] = { lat: next[id].lat + (Math.random() - 0.5) * 0.002, lng: next[id].lng + (Math.random() - 0.5) * 0.002 };
        });
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [store.busRoutes]);

  const totalStudents = store.busRoutes.reduce((a, r) => a + r.students, 0);

  return (
    <div>
      <PageHeader title="Transport Management" subtitle="GPS tracking, route management, and fleet overview" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard label="Active Buses" value={String(store.busRoutes.length)} icon={Bus} tone="info" />
        <StatCard label="Total Students" value={String(totalStudents)} icon={Users} tone="success" />
        <StatCard label="Routes" value={String(store.busRoutes.length)} icon={MapPin} />
        <StatCard label="On Schedule" value={`${store.busRoutes.length}/${store.busRoutes.length}`} icon={Bus} tone="success" />
      </div>

      <div className="flex gap-1 mb-4 rounded-lg bg-muted p-1">
        {([["tracking","Live Tracking"],["routes","Route Builder"]] as const).map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${tab === k ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{l}</button>
        ))}
      </div>

      {tab === "tracking" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Panel title="Live GPS Map">
              <div className="relative h-80 rounded-lg bg-gradient-to-br from-[#1a2e5a]/10 to-accent/5 border border-border overflow-hidden">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle, oklch(0.55 0.13 255) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
                {store.busRoutes.map(r => {
                  const pos = positions[r.id] || { lat: r.currentLat, lng: r.currentLng };
                  const x = ((pos.lng - 73.83) / 0.04) * 100;
                  const y = ((18.55 - pos.lat) / 0.04) * 100;
                  return (
                    <div key={r.id} onClick={() => setSelectedRoute(r.id)} className="absolute cursor-pointer transition-all duration-1000" style={{ left: `${Math.min(90, Math.max(5, x))}%`, top: `${Math.min(90, Math.max(5, y))}%` }}>
                      <div className={`relative flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium shadow-lg ${selectedRoute === r.id ? "bg-accent text-accent-foreground scale-110" : "bg-card text-foreground border border-border"}`}>
                        <Bus className="h-3.5 w-3.5" />{r.routeNo}
                        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[oklch(0.65_0.15_155)] animate-pulse" />
                      </div>
                    </div>
                  );
                })}
                {store.busRoutes.length === 0 && <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No buses to track</div>}
              </div>
            </Panel>
          </div>
          <div className="space-y-3">
            {store.busRoutes.map(r => (
              <div key={r.id} onClick={() => setSelectedRoute(r.id)} className={`rounded-xl border p-4 shadow-sm cursor-pointer transition-all hover:shadow-md ${selectedRoute === r.id ? "border-accent bg-accent/5" : "border-border bg-card"}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground"><Bus className="h-5 w-5" /></div>
                  <div><div className="font-semibold">{r.routeNo}</div><div className="text-xs text-muted-foreground">{r.busNo}</div></div>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1"><Users className="h-3 w-3" />{r.students}/{r.capacity} students</div>
                  <div className="flex items-center gap-1"><Phone className="h-3 w-3" />{r.driver} · {r.phone}</div>
                </div>
                <div className="mt-2 flex gap-1">{r.stops.map((s, i) => <span key={i} className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{s.name}</span>)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "routes" && (
        <Panel title="Route Configuration" action={<button onClick={() => setShowAdd(true)} className="flex items-center gap-1 text-xs text-accent hover:underline"><Plus className="h-3.5 w-3.5" />Add Route</button>}>
          <div className="space-y-4">{store.busRoutes.map(r => (
            <div key={r.id} className="rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-3"><div className="font-semibold">{r.routeNo} — {r.busNo}</div><div className="text-sm text-muted-foreground">{r.driver}</div></div>
              <div className="flex items-center gap-2">{r.stops.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="text-center"><div className="h-3 w-3 rounded-full bg-accent mx-auto" /><div className="text-[10px] mt-1 text-muted-foreground">{s.name}</div><div className="text-[10px] font-medium">{s.time}</div></div>
                  {i < r.stops.length - 1 && <div className="h-0.5 w-8 bg-border" />}
                </div>
              ))}</div>
            </div>
          ))}</div>
          {store.busRoutes.length === 0 && <EmptyState icon={Bus} title="No routes" description="Add a route to get started." />}
        </Panel>
      )}

      {showAdd && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAdd(false)}><div onClick={e=>e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
        <div className="flex justify-between mb-4"><h2 className="text-lg font-semibold">Add Route</h2><button onClick={() => setShowAdd(false)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted"><X className="h-4 w-4" /></button></div>
        <form onSubmit={e => { e.preventDefault(); const fd = new FormData(e.currentTarget); dispatch({ type: "ADD_BUS_ROUTE", payload: { id: genId(), routeNo: fd.get("route") as string, driver: fd.get("driver") as string, phone: fd.get("phone") as string, busNo: fd.get("bus") as string, capacity: Number(fd.get("capacity")), students: 0, currentLat: 18.52, currentLng: 73.85, stops: [{ name: "Start", time: "07:30", lat: 18.52, lng: 73.85 }, { name: "School", time: "08:20", lat: 18.545, lng: 73.835 }] } }); toast.success("Route added"); setShowAdd(false); }} className="space-y-3">
          {[["route","Route No"],["bus","Bus No"],["driver","Driver Name"],["phone","Phone"],["capacity","Capacity"]].map(([k,l]) => <div key={k}><label className="mb-1 block text-sm font-medium">{l}</label><input name={k} required className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" /></div>)}
          <button type="submit" className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all">Add Route</button>
        </form>
      </div></div>}
    </div>
  );
}
