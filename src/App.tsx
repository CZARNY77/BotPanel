import { Outlet, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./auth/RequireAuth";
import { Layout } from "./components/Layout";
import { ServersProvider } from "./hooks/useServers";
import { Landing } from "./pages/Landing";
import { NotFound } from "./pages/NotFound";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { TermsOfService } from "./pages/TermsOfService";
import { AppShell } from "./shell/AppShell";
import { DashboardIndex } from "./shell/DashboardIndex";

const Dashboard = () => (
  <RequireAuth>
    <ServersProvider>
      <Outlet />
    </ServersProvider>
  </RequireAuth>
);

export default function App() {
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />}>
        <Route index element={<DashboardIndex />} />
        <Route path=":serverId" element={<DashboardIndex />} />
        <Route path=":serverId/:section" element={<AppShell />} />
      </Route>
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
