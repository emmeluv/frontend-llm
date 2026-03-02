import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import Chat from './pages/Chat'
import Ingest from './pages/Ingest'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Chat />} />
          <Route path="/ingest" element={<Ingest />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
