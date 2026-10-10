// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import WelcomeScreen from './screens/WelcomeScreen'
import SurveyScreen from './screens/SurveyScreen'

export default function App() {
  return (
    <BrowserRouter>
      <div className="relative min-h-dvh bg-white">
        <Routes>
          <Route path="/" element={<WelcomeScreen />} />
          <Route path="/survey" element={<SurveyScreen />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}