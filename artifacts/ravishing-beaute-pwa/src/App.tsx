import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import BottomNav from "@/components/BottomNav";
import AdminQuickActions from "@/components/AdminQuickActions";
import Home from "@/pages/Home";
import Gallery from "@/pages/Gallery";
import Services from "@/pages/Services";
import Book from "@/pages/BookPublic";
import About from "@/pages/About";
import Notifications from "@/pages/Notifications";
import Contact from "@/pages/Contact";
import Policies from "@/pages/Policies";
import Reviews from "@/pages/Reviews";
import Admin from "@/pages/Admin";
import AdminPricing from "@/pages/AdminPricing";
import AdminTools from "@/pages/AdminTools";
import AdminSchedule from "@/pages/AdminScheduleSettings";
import AdminDeposits from "@/pages/AdminDeposits";
import AdminNotes from "@/pages/AdminNotes";
import AdminNotifications from "@/pages/AdminNotifications";
import AdminReviews from "@/pages/AdminReviews";
import AdminAvailability from "@/pages/AdminAvailability";
import AdminSettings from "@/pages/AdminSettings";
import Debug from "@/pages/Debug";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/gallery" component={Gallery} />
        <Route path="/services" component={Services} />
        <Route path="/book" component={Book} />
        <Route path="/about" component={About} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/contact" component={Contact} />
        <Route path="/policies" component={Policies} />
        <Route path="/reviews" component={Reviews} />
        <Route path="/admin" component={Admin} />
        <Route path="/admin/pricing" component={AdminPricing} />
        <Route path="/admin/tools" component={AdminTools} />
        <Route path="/admin/schedule" component={AdminSchedule} />
        <Route path="/admin/deposits" component={AdminDeposits} />
        <Route path="/admin/notes" component={AdminNotes} />
        <Route path="/admin/notifications" component={AdminNotifications} />
        <Route path="/admin/reviews" component={AdminReviews} />
        <Route path="/admin/availability" component={AdminAvailability} />
        <Route path="/admin/settings" component={AdminSettings} />
        <Route path="/debug" component={Debug} />
        <Route component={NotFound} />
      </Switch>
      <AdminQuickActions />
      <BottomNav />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
      <Toaster />
    </QueryClientProvider>
  );
}
