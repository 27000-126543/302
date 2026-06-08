import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from '@/components/layout/Header'
import OverviewPage from '@/pages/OverviewPage'
import DispatchPage from '@/pages/DispatchPage'
import InspectionPage from '@/pages/InspectionPage'
import FumigationPage from '@/pages/FumigationPage'
import EquipmentPage from '@/pages/EquipmentPage'
import AdminPage from '@/pages/AdminPage'
import ReportPage from '@/pages/ReportPage'

export default function App() {
  return (
    <Router>
      <div className="w-screen h-screen flex flex-col bg-[#050d1a] overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden relative">
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/dispatch" element={<DispatchPage />} />
            <Route path="/inspection" element={<InspectionPage />} />
            <Route path="/fumigation" element={<FumigationPage />} />
            <Route path="/equipment" element={<EquipmentPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/report" element={<ReportPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}
