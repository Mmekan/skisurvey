// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import WelcomeScreen from './screens/WelcomeScreen'
import SurveyScreen from './screens/SurveyScreen'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomeScreen />} />
        <Route path="/survey" element={<SurveyScreen />} />
      </Routes>
    </BrowserRouter>
  )
}