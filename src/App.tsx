/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import SuspectEntry from './pages/SuspectEntry';
import AdminDashboard from './pages/AdminDashboard';
import Judgement from './pages/Judgement';
import AdminLogin from './pages/AdminLogin';
import CorkboardLayout from './components/CorkboardLayout';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/suspect-entry" replace />} />
      <Route element={<CorkboardLayout />}>
        <Route path="/suspect-entry" element={<SuspectEntry />} />
        <Route path="/hq-admin/login" element={<AdminLogin />} />
        <Route path="/hq-admin" element={<AdminDashboard />} />
        <Route path="/hq-admin/judgement" element={<Judgement />} />
      </Route>
    </Routes>
  );
}
