import { AnimatePresence } from 'motion/react'
import { createContext, lazy, Suspense, useContext, useEffect, useState, type ReactNode } from 'react'

// The search index (every pet, recipe and guide heading) only loads the first time search opens.
const Palette = lazy(() => import('./SearchPalette'))

const SearchCtx = createContext<{ open: () => void }>({ open: () => {} })
export const useSearch = () => useContext(SearchCtx)

export function SearchProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen((o) => !o) }
      if (e.key === '/' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) { e.preventDefault(); setOpen(true) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return (
    <SearchCtx.Provider value={{ open: () => setOpen(true) }}>
      {children}
      <Suspense fallback={null}><AnimatePresence>{isOpen && <Palette onClose={() => setOpen(false)} />}</AnimatePresence></Suspense>
    </SearchCtx.Provider>
  )
}

