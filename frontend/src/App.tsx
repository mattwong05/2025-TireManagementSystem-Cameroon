import React from 'react'
import { useAuth } from './contexts/AuthContext'
import { Dashboard } from './components/Dashboard'
import { LoginForm } from './components/LoginForm'

const App: React.FC = () => {
  const { token, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 dark:text-slate-400">
        Loading…
      </div>
    )
  }

  return token ? <Dashboard /> : <LoginForm />
}

export default App
