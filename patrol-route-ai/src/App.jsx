import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import RouteGenerator from "./pages/RouteGenerator";
import RiskZones from "./pages/RiskZones";
import Analytics from "./pages/Analytics";
// import Simulation from "./pages/Simulation";
import Navbar from "./components/Navbar";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/route" element={<RouteGenerator />} />
        <Route path="/zones" element={<RiskZones />} />
        <Route path="/analytics" element={<Analytics />} />
        {/* <Route path="/simulation" element={<Simulation />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
