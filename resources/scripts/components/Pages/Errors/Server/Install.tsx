'use client'

import { useState, useEffect } from 'react'
import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button'
import { Moon, SunMoon, LinkIcon, LucideMoon, LucideSun, ServerIcon, LucideServerOff, LucideServerCrash } from 'lucide-react'
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
    <div className="relative min-h-screen flex flex-col items-center justify-center dark:bg-black bg-zinc-100 ">
      {/* very epic coool image  Image */}
      <img 
  src="https://i.ibb.co/1T3f93b/5sYyaxDk.png"
  alt="spicy image ;)"
  className="absolute inset-0 w-full h-full object-cover object-center opacity-0 dark:opacity-5 backdrop-blur-xl shadow-xl"
/>
      
      {/* Content */}
      <div className="relative z-10">
        <Card className="w-full max-w-md p-8 text-center dark:bg-black bg-white backdrop-blur-xl ">
          <CardContent className="space-y-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full ">
              <LucideServerCrash className="h-12 w-12 text-black dark:text-white" />
            </div>
            <h1 className="text-6xl font-bold dark:text-white text-black">Installing / (Pending Install status) </h1>
            <p className="text-lg text-black dark:text-zinc-300">
              This server is reinstalling or installing itself to fix the issue. Refresh this page to try again. If your server is special it might be waiting for special treatment.
            </p>
            <Button asChild variant="default" size="lg" className="dark:bg-zinc-900 bg-zinc-100  dark:hover:bg-zinc-800 hover:bg-zinc-400   text-black  dark:text-white">
              <Link href="/dashboard">Come back later 👋🏼 </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Dark Mode Toggle */}
      <div className="fixed bottom-2 right-4 z-10">
        <button
          onClick={toggleTheme}
          className={`
            relative w-14 h-7 rounded-full transition-colors duration-300 ease-in-out
            ${isDarkMode ? 'bg-blue-600' : 'bg-zinc-600'}
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
          `}
        >
          <span className="sr-only">Toggle dark mode</span>
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