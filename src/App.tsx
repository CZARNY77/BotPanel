import { Navigate, Route, Routes } from "react-router-dom";
import PanelLayout from "./layouts/PanelLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import WelcomePage from "./pages/WelcomePage";
import EventsPage from "./pages/EventsPage";
import EmojiPage from "./pages/EmojiPage";
import ModerationPage from "./pages/ModerationPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<PanelLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/emoji" element={<EmojiPage />} />
        <Route path="/moderation" element={<ModerationPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
