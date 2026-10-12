// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import WelcomeScreen from './screens/WelcomeScreen'
import SurveySkeleton from './components/SurveySkeleton'

const SurveyScreen = lazy(() => import('./screens/SurveyScreen'))

export default function App() {
  return (
    <BrowserRouter>
      <div className="relative min-h-dvh bg-white">
        <Routes>
          <Route path="/" element={<WelcomeScreen />} />
          <Route
            path="/survey"
            element={
              <Suspense fallback={<SurveySkeleton />}>
                <SurveyScreen />
              </Suspense>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  )
}