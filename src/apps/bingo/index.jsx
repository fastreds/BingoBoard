import React, { useState, useEffect } from "react";
import WelcomeScreen from "./components/WelcomeScreen";
import PresenterScreen from "./components/PresenterScreen";
import ControllerScreen from "./components/ControllerScreen";
import PlayerScreen from "./components/PlayerScreen";

export default function BingoApp() {
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem("bingo-session");
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
      localStorage.setItem("bingo-session", JSON.stringify(session));
    } else {
      localStorage.removeItem("bingo-session");
    }
  }, [session]);

  const handleLeave = () => {
    setSession(null);
  };

  if (!session) {
    return <WelcomeScreen onSelectRole={setSession} />;
  }

  switch (session.role) {
    case "presenter":
      return <PresenterScreen roomId={session.roomId} onLeave={handleLeave} />;
    case "controller":
      return <ControllerScreen roomId={session.roomId} onLeave={handleLeave} />;
    case "player":
      return (
        <PlayerScreen 
          roomId={session.roomId} 
          playerName={session.playerName} 
          onLeave={handleLeave} 
        />
      );
    default:
      return <WelcomeScreen onSelectRole={setSession} />;
  }
}
