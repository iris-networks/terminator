import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { Layout } from '@/components/layout/Layout'
import { AboutPage } from '@/components/about/AboutPage'
import './globals.css'

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<ChatInterface />} />
            <Route path="/:sessionId" element={<ChatInterface />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)