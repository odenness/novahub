import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import './index.css'
import { Layout, PageTransition } from './components/Layout'
import { SearchProvider } from './components/Search'
import { ReminderEngine } from './lib/reminders'
import Today from './pages/Today'
import Timers from './pages/Timers'
import Pets from './pages/Pets'
// Guide and Crafting carry most of the data, so they load on first visit.
const GuideIndex = lazy(() => import('./pages/Guide').then((m) => ({ default: m.GuideIndex })))
const Chapter = lazy(() => import('./pages/Guide').then((m) => ({ default: m.Chapter })))
const CraftingIndex = lazy(() => import('./pages/Crafting').then((m) => ({ default: m.CraftingIndex })))
const CraftingItem = lazy(() => import('./pages/Crafting').then((m) => ({ default: m.CraftingItem })))
import Meter from './pages/Meter'

function AppRoutes() {
  const location = useLocation()
  return (
    <PageTransition>
      <Suspense fallback={<div className="py-20 text-center text-parch-500">Loading…</div>}>
            <Routes location={location}>
              <Route path="/" element={<Today />} />
              <Route path="/timers" element={<Timers />} />
              <Route path="/pets" element={<Pets />} />
              <Route path="/guide" element={<GuideIndex />} />
              <Route path="/guide/:id" element={<Chapter />} />
              <Route path="/crafting" element={<CraftingIndex />} />
              <Route path="/crafting/:id" element={<CraftingItem />} />
              <Route path="/meter" element={<Meter />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
      </Suspense>
    </PageTransition>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <HashRouter>
        <SearchProvider>
          <ReminderEngine />
          <Layout>
            <AppRoutes />
          </Layout>
        </SearchProvider>
      </HashRouter>
    </MotionConfig>
  </StrictMode>,
)
