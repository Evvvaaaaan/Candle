import { createBrowserRouter, Navigate } from "react-router";
import { Onboarding } from "./screens/Onboarding";
import { Home } from "./screens/Home";
import { Login } from "./screens/Login";
import { Verification } from "./screens/Verification";
import { Nickname } from "./screens/Nickname";
import { AdWatch } from "./screens/AdWatch";
import { Prediction } from "./screens/Prediction";
import { Result } from "./screens/Result";
import { NotificationSettings } from "./screens/NotificationSettings";
import { RewardClaim } from "./screens/RewardClaim";
import { Ranking } from "./screens/Ranking";
import { MyPage } from "./screens/MyPage";
import { History } from "./screens/History";
import { News } from "./screens/News";
import { NewsDetail } from "./screens/NewsDetail";
import { Settings } from "./screens/Settings";
import { StockSearch } from "./screens/StockSearch";

// Root component that handles initial routing logic
function RootRedirect() {
  // In a real app, this would check localStorage/context for auth state
  // For this prototype, we'll check if it's the user's first time visiting
  const hasVisited = localStorage.getItem("candle_visited");

  if (!hasVisited) {
    localStorage.setItem("candle_visited", "true");
    // 첫 진입시: onboarding으로 이동
    return <Navigate to="/onboarding" replace />;
  }

  // 기본 페이지: home으로 이동
  return <Navigate to="/home" replace />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootRedirect,
  },
  {
    path: "/onboarding",
    Component: Onboarding,
  },
  {
    path: "/home",
    Component: Home,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/verification",
    Component: Verification,
  },
  {
    path: "/nickname",
    Component: Nickname,
  },
  {
    path: "/ad-watch",
    Component: AdWatch,
  },
  {
    path: "/prediction",
    Component: Prediction,
  },
  {
    path: "/result",
    Component: Result,
  },
  {
    path: "/notifications",
    Component: NotificationSettings,
  },
  {
    path: "/reward",
    Component: RewardClaim,
  },
  {
    path: "/ranking",
    Component: Ranking,
  },
  {
    path: "/history",
    Component: History,
  },
  {
    path: "/news",
    Component: News,
  },
  {
    path: "/news/:id",
    Component: NewsDetail,
  },
  {
    path: "/mypage",
    Component: MyPage,
  },
  {
    path: "/settings",
    Component: Settings,
  },
  {
    path: "/stock-search",
    Component: StockSearch,
  },
]);