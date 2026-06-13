import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardScreen from "./apps/dashboard";
import BingoApp from "./apps/bingo";
import ExpositorApp from "./apps/expositor";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardScreen />} />
        <Route path="/bingo" element={<BingoApp />} />
        <Route path="/expositor" element={<ExpositorApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
