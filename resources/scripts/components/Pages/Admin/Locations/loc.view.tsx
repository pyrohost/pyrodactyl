import React, { useState, useEffect } from 'react';
import { Head, usePage, useForm } from '@inertiajs/react';
import AuthenticatedLayout from "@/components/Layouts/AuthenticatedLayout";
import { Cog, Crown, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import useSWR from 'swr';
import getServers from '@/api/getServers';
import { PaginatedResult } from '@/api/http';
import { Server } from '@/api/server/getServer';
import ServerRow from '../dashboard/ServerRow';
import ServerList from '@/components/Pages/Common/ServersContainer';
import AdminLayout from '@/components/Layouts/AdminLayout';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"
import UserForm from './components/users.form';
import LocationForm from './components/location.form';

// Type definitions for Page Props
interface PageProps {
  auth: {
    user: {
      name: string;
      rank: string;
      pterodactyl_id: string;
    };
  };
  darkMode: boolean;
  companyDesc: string;


}


interface AdminDashboard {
    user: {
      id: number
      username: string
      email: string
      name_first: string
      name_last: string
      language: string
      root_admin: boolean
      limits: ResourceLimits
      resources: ResourceLimits
    }
  }
  
  interface ResourceLimits {
    cpu: number
    memory: number
    disk: number
    allocations: number
    backups: number
    servers: number
  }
  
  const defaultValues: ResourceLimits = {
    cpu: 0,
    memory: 0,
    disk: 0,
    allocations: 0,
    backups: 0,
    servers: 0,
  }

export default function AdminDashboard(): JSX.Element {
  const { props } = usePage<PageProps>();
  const { auth, companyDesc, user } = props;
  
  const userRank = auth.user.rank;
  const pterodactylId = auth.user.pterodactyl_id;

  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString());
  const [activeProjects, setActiveProjects] = useState<number>(0);

  console.log(props)

  const { data, setData, patch, processing, errors } = useForm({
      username: user?.username || "",
      email: user?.email || "",
      name_first: user?.name_first || "",
      name_last: user?.name_last || "",
      language: user?.language || "en",
      root_admin: user?.root_admin || false,
      limits: { ...defaultValues, ...user?.limits },
      resources: { ...defaultValues, ...user?.resources },
    })
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      patch(`/admin/users/view/${user.id}`, {
        onSuccess: () => toast.success("User updated successfully"),
        onError: () => toast.error("Failed to update user"),
        preserveScroll: true,
      })
    }
  
    const updateResource = (type: "resources" | "limits", key: keyof ResourceLimits, value: string) => {
      const numValue = Number.parseFloat(value) || 0
      setData(type, { ...data[type], [key]: numValue })
    }
  
    const getResourcePercentage = (current: number, limit: number) => {
      if (limit === 0) return 0
      return (current / limit) * 100
    }

  // Clock Update
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch Active Projects
  const { data: servers, error } = useSWR<PaginatedResult<Server>>(
    ['/api/client/', userRank === 'admin', 1],
    () => getServers({ page: 1, type: userRank === 'admin' ? 'admin' : undefined })
  );

  //console.log(servers.items.length)



  useEffect(() => {
    if (servers && servers.items) {
      setActiveProjects(servers.items.length);
    }
  }, [servers]);

  if (error) {
    setActiveProjects('Error');
  }

  //console.log(activeProjects)

  // Get Rank Badge
  const getRankBadge = (): JSX.Element => {
    switch (userRank) {
      case 'admin':
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-red-500 text-white flex items-center">
            <Cog className="mr-1 h-4 w-4" />
            Admin
          </span>
        );
      case 'premium':
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-green-500 text-white flex items-center">
            <Crown className="mr-1 h-4 w-4" />
            Premium
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-zinc-500 text-white flex items-center">
            <User className="mr-1 h-4 w-4" />
            Hobby tier
          </span>
        );
    }
  };

  return (
    <AdminLayout
      header={
        <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
          Home / Admin / Location
        </h2>
      }
      
    >
      <Head title="Servers" />

      <LocationForm/>
    </AdminLayout>
  );
}
