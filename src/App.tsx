import { HashRouter, Routes, Route } from "react-router-dom";
import { Home } from "./routes/Home.js";
import { Study } from "./routes/Study.js";
import { Practice } from "./routes/Practice.js";
import { Test } from "./routes/Test.js";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/study" element={<Study />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/test" element={<Test />} />
      </Routes>
    </HashRouter>
  );
}
