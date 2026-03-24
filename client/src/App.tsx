import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation, Link } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import ScannerPage from "./pages/ScannerPage";
import SearchPage from "./pages/SearchPage";
import ReceivePage from "./pages/ReceivePage";
import HistoryPage from "./pages/HistoryPage";
import InventoryPage from "./pages/InventoryPage";
import CheckInPage from "./pages/CheckInPage";
import { Home as HomeIcon, ScanLine, Search, Package, History, Warehouse, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", icon: HomeIcon, label: "Home" },
  { href: "/checkin", icon: LogIn, label: "Check-In" },
  { href: "/scan", icon: ScanLine, label: "Scan" },
  { href: "/receive", icon: Package, label: "Receive" },
  { href: "/inventory", icon: Warehouse, label: "Inventory" },
  { href: "/history", icon: History, label: "History" },
];

function BottomNav() {
  const [location] = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border">
      <div className="flex items-center justify-around px-2 pt-2 max-w-[600px] mx-auto" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = href === "/" ? location === "/" : location.startsWith(href);
          return (
            <Link key={href} href={href}>
              <div className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[52px]",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                  isActive ? "bg-primary/15" : "bg-transparent"
                )}>
                  <Icon className={cn("w-5 h-5 transition-all", isActive && "scale-110")} />
                </div>
                <span className={cn(
                  "text-[10px] font-medium",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <main className="overflow-y-auto pb-28 max-w-[600px] mx-auto w-full min-h-screen">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/checkin" component={CheckInPage} />
        <Route path="/scan" component={ScannerPage} />
        <Route path="/receive" component={ReceivePage} />
        <Route path="/search" component={SearchPage} />
        <Route path="/inventory" component={InventoryPage} />
        <Route path="/history" component={HistoryPage} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "oklch(0.18 0.015 240)",
                border: "1px solid oklch(0.28 0.02 240)",
                color: "oklch(0.95 0.005 240)",
              },
            }}
          />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
