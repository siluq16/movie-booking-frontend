import { createContext, useContext, useState, useEffect } from 'react'
import { userService } from '../services/movieService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [token, setToken]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser  = localStorage.getItem('user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = (loginResponse) => {
    const { token, userId, fullName, role, avatarUrl } = loginResponse
    const userObj = { id: userId, fullName, role, avatarUrl }
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userObj))
    setToken(token)
    setUser(userObj)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  const reloadUser = async () => {
    try {
        if (!user?.id) return;

        const res = await userService.getById(user.id);
        const updatedUser = res.data; 
        
        setUser(updatedUser);

        localStorage.setItem('user', JSON.stringify(updatedUser));
        
    } catch (error) {
        console.error("Lỗi khi reload user:", error);
    }
  };

  const isAdmin    = user?.role === 'admin'
  const isLoggedIn = !!token

  return (
    <AuthContext.Provider value={{ user, token, loading, isAdmin, isLoggedIn, login, logout, reloadUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
