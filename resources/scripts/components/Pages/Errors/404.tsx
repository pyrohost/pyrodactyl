'use client'

import { useState, useEffect } from 'react'
import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button'
import { Moon, SunMoon, LinkIcon, LucideMoon, LucideSun } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function NotFound() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const darkModePreference = localStorage.getItem('dark-mode') === 'true'
    setIsDarkMode(darkModePreference)
    if (darkModePreference) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    localStorage.setItem('dark-mode', newDarkMode.toString())
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-100 dark:bg-zinc-900 text-foreground transition-colors">
      <Card className="w-full max-w-md p-8 text-center">
  <CardContent className="space-y-6">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
      <LinkIcon className="h-6 w-6" />
    </div>
    <h1 className="text-6xl font-bold">404</h1>
    <p className="text-lg text-muted-foreground">
      The link is either broken or doesn&apos;t exist on the server.
    </p>
    <Button asChild variant="default" size="lg">
      <Link href="/dashboard">Return to Dashboard</Link>
    </Button>
  </CardContent>
</Card>

      {/* Dark Mode Toggle */}
       <div className="fixed bottom-2 right-4">
          <button
              onClick={toggleTheme}
              className={`
                  relative w-14 h-7 rounded-full transition-colors duration-300 ease-in-out
                  ${isDarkMode ? 'bg-blue-600' : 'bg-zinc-600'}
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
              `}
          >
              <span className="sr-only">Toggle dark mode</span>
              
              {/* Toggle Knob */}
              <div
                  className={`
                      absolute top-1 left-1 transform transition-transform duration-300 ease-in-out
                      w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center
                      ${isDarkMode ? 'translate-x-7' : 'translate-x-0'}
                  `}
              >
                  {isDarkMode ? (
                      <Moon className="w-3 h-3 text-indigo-600" />
                  ) : (
                      <LucideSun className="w-3 h-3 text-black" />
                  )}
              </div>
          </button>
      </div>
                     
    </div>
  )
}

