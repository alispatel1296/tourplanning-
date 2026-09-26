import { RouterProvider } from 'react-router-dom'
import { router } from '@/app/router'
import { AppStateProvider } from '@/state/AppState'

export default function App() {
  return (
    <AppStateProvider>
      <RouterProvider router={router} />
    </AppStateProvider>
  )
}
