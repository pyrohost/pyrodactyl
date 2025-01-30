import React, { useState, useEffect } from "react"
import { Bell, Check, AlertCircle, Info, X } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import axios from "axios"
import { router } from "@inertiajs/react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

interface Notification {
  id: number
  title: string
  description: string
  type: string
  read: boolean
  created_at: string
  image_url: string | null
}

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = async () => {
    try {
      const response = await axios.get("/api/inerstia/notifications?new=1000")
      setNotifications(response.data.data)
      setUnreadCount(response.data.data.filter((n) => !n.read).length)
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    }
  }

  const markAsRead = async (id: number) => {
    try {
      await router.post(`/api/inerstia/notifications/${id}/read`, {
        preserveScroll: true,
        onSuccess: () => {
          setNotifications((prev) =>
            prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
          )
          setUnreadCount((prev) => Math.max(0, prev - 1))
        },
      })
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const getIcon = (type: string) => {
    switch (type) {
      case "warning":
        return AlertCircle
      case "info":
        return Info
      default:
        return Bell
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative w-10 h-10 rounded-full">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 px-1 min-w-[1.25rem] h-5">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="text-sm font-semibold">Notifications</h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Mark all as read
          </Button>
        </div>
        <ScrollArea className="h-[32rem]">
          {notifications.length > 0 ? (
            notifications.map((notification) => {
              const Icon = getIcon(notification.type)
              return (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-zinc-200 dark:border-zinc-700 last:border-0 ${
                    notification.read ? "bg-white dark:bg-zinc-900" : "bg-zinc-50 dark:bg-zinc-800"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-1 p-1 rounded-full ${
                        notification.type === "warning"
                          ? "bg-yellow-100 dark:bg-yellow-900"
                          : "bg-blue-100 dark:bg-blue-900"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${
                          notification.type === "warning"
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-blue-600 dark:text-blue-400"
                        }`}
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{notification.title}</p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">{notification.description}</p>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-zinc-400 dark:text-zinc-500">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="h-auto p-0 text-xs font-normal text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Mark as read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="p-4 text-center text-zinc-500 dark:text-zinc-400">No notifications</div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

