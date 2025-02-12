"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Moon, Sun } from "lucide-react"

const PrivacyPolicy: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [darkMode])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-zinc-900 transition-colors duration-300">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-bold text-zinc-800 dark:text-white">Privacy Policy</h1>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-gray-200 dark:bg-zinc-700 text-zinc-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              {darkMode ? <Sun size={24} /> : <Moon size={24} />}
            </button>
          </div>

          {[
            {
              title: "1. Information We Collect",
              content:
                "We collect information that you provide directly to us, including when you create an account, make a purchase, or contact us for support. This means during the login process we collect the information you let us collect like emails. (Your passwords ARE NOT collected during any login process)",
            },
            {
              title: "2. How We Use Your Information",
              content:
                "We use the information we collect to provide, maintain, and improve our services, to process your transactions, and to communicate with you. Your email will never be sold nor used for anything else.",
            },
            {
              title: "3. Information Sharing",
              content:
                "We do not sell, trade, or otherwise transfer your personally identifiable information to third parties. Do not worry about your data being shared with anyone.",
            },
            {
              title: "4. Data Security",
              content:
                "We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. We recommend daily backups to ensure your data is safe. All data stored is encrypted in our databases.",
            },
            {
              title: "5. Servers hosted on our network",
              content:
                "We implement appropriate security measures to protect your personal information hosted on our servers. We do daily check-ups on our servers to verify nothing illegal is happening on our servers.",
            },
            {
              title: "6. Contact Us",
              content:
                "If you have any questions about this Privacy Policy, please contact us at udayanthie.work@gmail.com, help@nadhi.dev, or contact.ryx.us",
            },
          ].map((section, index) => (
            <section
              key={index}
              className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-6 space-y-4 transition-colors duration-300"
            >
              <h2 className="text-2xl font-semibold text-zinc-800 dark:text-white">{section.title}</h2>
              <p className="text-gray-600 dark:text-gray-300">{section.content}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicy

