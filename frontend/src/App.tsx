import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { NotesList } from '@/pages/NotesList';
import { NoteEdit } from '@/pages/NoteEdit';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<NotesList />} />
        <Route path="/notes/:id" element={<NoteEdit />} />
      </Routes>
      <Toaster position="bottom-right" richColors />
    </BrowserRouter>
  );
}

export default App;
