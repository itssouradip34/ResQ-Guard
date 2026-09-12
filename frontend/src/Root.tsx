import React, { useState } from "react";
import App from "./App";
import { AuthRoleProvider } from "./context/AuthRoleContext";
import { Landing } from "./Landing";
import { OurTeam } from "./OurTeam";

type Screen = "landing" | "team" | "app";

export const Root: React.FC = () => {
  const [screen, setScreen] = useState<Screen>("landing");

  if (screen === "landing") {
    return (
      <Landing
        onGetStarted={() => setScreen("app")}
        onViewTeam={() => setScreen("team")}
      />
    );
  }

  if (screen === "team") {
    return <OurTeam onBack={() => setScreen("landing")} />;
  }

  return (
    <AuthRoleProvider>
      <App />
    </AuthRoleProvider>
  );
};

export default Root;
