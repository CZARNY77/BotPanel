import { Navigate, Route, Routes } from "react-router-dom";
import PanelLayout from "./layouts/PanelLayout";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import WelcomePage from "./pages/WelcomePage";
import EventsPage from "./pages/EventsPage";
import EmojiPage from "./pages/EmojiPage";
import ModerationPage from "./pages/ModerationPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/panel/*" element={<PanelLayout />}>
        <Route index element={<Navigate to="/panel/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="welcome" element={<WelcomePage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="emoji" element={<EmojiPage />} />
        <Route path="moderation" element={<ModerationPage />} />
      </Route>
      <Route path="/dashboard" element={<Navigate to="/panel/dashboard" replace />} />
      <Route path="/welcome" element={<Navigate to="/panel/welcome" replace />} />
      <Route path="/events" element={<Navigate to="/panel/events" replace />} />
      <Route path="/emoji" element={<Navigate to="/panel/emoji" replace />} />
      <Route path="/moderation" element={<Navigate to="/panel/moderation" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
