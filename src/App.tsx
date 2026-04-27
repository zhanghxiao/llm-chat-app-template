import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import AppLayout from '@/components/AppLayout';
import Dashboard from '@/pages/Dashboard';
import SlopeChart from '@/pages/SlopeChart';
import RankingRace from '@/pages/RankingRace';
import RankingTable from '@/pages/RankingTable';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/slope" element={<SlopeChart />} />
            <Route path="/race" element={<RankingRace />} />
            <Route path="/ranking" element={<RankingTable />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
