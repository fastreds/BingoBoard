import React, { useState, useEffect } from "react";
import WelcomeScreen from "./components/WelcomeScreen";
import TimerPresenterScreen from "./components/TimerPresenterScreen";
import TimerControllerScreen from "./components/TimerControllerScreen";

export default function ExpositorApp() {
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem("expositor-session");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn("Failed to parse saved session", e);
      }
    }
    return null;
  });

  useEffect(() => {
    if (session) {
      localStorage.setItem("expositor-session", JSON.stringify(session));
    } else {
      localStorage.removeItem("expositor-session");
    }
  }, [session]);

  const handleLeave = () => {
    setSession(null);
  };

  if (!session) {
    return <WelcomeScreen onSelectRole={setSession} />;
  }

  switch (session.role) {
    case "timer_presenter":
      return <TimerPresenterScreen roomId={session.roomId} onLeave={handleLeave} />;
    case "timer_controller":
      return <TimerControllerScreen roomId={session.roomId} onLeave={handleLeave} />;
    default:
      return <WelcomeScreen onSelectRole={setSession} />;
  }
}
