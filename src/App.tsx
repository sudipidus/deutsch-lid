import { HashRouter, Routes, Route } from "react-router-dom";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<div className="p-6 text-xl">Leben in Deutschland</div>} />
      </Routes>
    </HashRouter>
  );
}
