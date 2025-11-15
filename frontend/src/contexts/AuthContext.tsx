import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { apiClient, setAuthToken } from '../api/client'
import { TokenResponse, UserProfile } from '../types'

interface AuthContextValue {
  token: string | null
  user: UserProfile | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const TOKEN_KEY = 'tms_token'

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    if (token) {
      setAuthToken(token)
      apiClient
        .get<UserProfile>('/auth/me')
        .then((response) => setUser(response.data))
        .catch(() => {
          setTokenState(null)
          setUser(null)
          setAuthToken(undefined)
          localStorage.removeItem(TOKEN_KEY)
        })
    } else {
      setAuthToken(undefined)
    }
  }, [token])

  const login = async (username: string, password: string) => {
    setLoading(true)
    try {
      const form = new URLSearchParams({ username, password })
      const { data } = await apiClient.post<TokenResponse>('/auth/login', form, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
      setTokenState(data.access_token)
      localStorage.setItem(TOKEN_KEY, data.access_token)
      setAuthToken(data.access_token)
      const profile = await apiClient.get<UserProfile>('/auth/me')
      setUser(profile.data)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setTokenState(null)
    setUser(null)
    setAuthToken(undefined)
    localStorage.removeItem(TOKEN_KEY)
  }

  const value = useMemo(
    () => ({ token, user, loading, login, logout }),
    [token, user, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
