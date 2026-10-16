import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LeakLedger } from './pages/LeakLedger';
import { FindingDetail } from './pages/FindingDetail';
import { Investigate } from './pages/Investigate';
import { CheckOrder } from './pages/CheckOrder';
import { Inventory } from './pages/Inventory';
import { Campaigns } from './pages/Campaigns';
import { ModelTrust } from './pages/ModelTrust';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<LeakLedger />} />
          <Route path="findings/:id" element={<FindingDetail />} />
          <Route path="investigate" element={<Investigate />} />
          <Route path="check-order" element={<CheckOrder />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="trust" element={<ModelTrust />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
