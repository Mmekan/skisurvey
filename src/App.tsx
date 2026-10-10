// src/App.tsx
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import WelcomeScreen from './screens/WelcomeScreen'
import SurveyScreen from './screens/SurveyScreen'

function Background() {
  const { pathname } = useLocation()
  const isSurvey = pathname.startsWith('/survey')
  if (!isSurvey) {
    return <div aria-hidden="true" className="fixed inset-0 -z-10 bg-white" />
  }
  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10">
      <img src="/study-bg.jpg" alt="" className="h-full w-full object-cover object-center" />
      <div className="absolute inset-0 bg-black/15" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="relative min-h-dvh">
        <Background />
        <Routes>
          <Route path="/" element={<WelcomeScreen />} />
          <Route path="/survey" element={<SurveyScreen />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}