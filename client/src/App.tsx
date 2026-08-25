import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EnquiryProvider } from "@/contexts/EnquiryContext";
import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

const Home = lazy(() => import("./pages/Home"));
const Collections = lazy(() => import("./pages/Collections"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const CapabilityPage = lazy(() => import("./pages/CapabilityPage"));
const Contact = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/collections" component={Collections} />
      <Route path="/collections/:id">{(params) => <ProductDetail id={params.id} />}</Route>
      <Route path="/manufacturing">{() => <CapabilityPage type="manufacturing" />}</Route>
      <Route path="/custom-furniture">{() => <CapabilityPage type="custom" />}</Route>
      <Route path="/export">{() => <CapabilityPage type="export" />}</Route>
      <Route path="/about">{() => <CapabilityPage type="about" />}</Route>
      <Route path="/contact" component={Contact} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <EnquiryProvider><Suspense fallback={<main className="route-loading" aria-live="polite">Loading Umaid Craftorium…</main>}><Router /></Suspense></EnquiryProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
