import React, { useState, useEffect } from 'react';
import { useForm, Head, usePage, router } from '@inertiajs/react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, User2, KeyRound, Eye, EyeOff, AlertCircle, Moon, Sun, LucideSunMoon, LucideCheckCircle2 } from 'lucide-react';
import { DiscordLogoIcon } from '@radix-ui/react-icons';
import { Separator } from '@/components/ui/separator';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
  } from "@/components/ui/alert-dialog"
import { redirect } from 'react-router-dom';

interface PageProps {
    AppConfig: {
        appTheme: string;
        appName: string;
    };
}

const Login: React.FC = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [Modal, setModal] = useState(false); // this for the warning if the user has been given new credentials
    const [Redirect, setRedirect] = useState(false);
    const { props } = usePage();
    const { flash, errors } = usePage().props as any;
    const { data, setData, post} = useForm({
        user: '',
        password: '',
    });
    const { AppConfig } = usePage().props as PageProps;

    useEffect(() => {
        const darkModePreference = localStorage.getItem('dark-mode') === 'true';
        setIsDarkMode(darkModePreference);
        if (darkModePreference) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    useEffect(() => {
        const url = new URL(window.location.href);
        const email = url.searchParams.get('email');
        const password = url.searchParams.get('password');

        if (email) {
            setData('user', email);
        }
        if (password) {
            setData('password', password);
        }

        if (email && password) {
            
            setModal(true);
            
        }
    }, []);

    const toggleTheme = () => {
        const newDarkMode = !isDarkMode;
        setIsDarkMode(newDarkMode);
        localStorage.setItem('dark-mode', newDarkMode.toString());
        if (newDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        post('/auth/login');
        setProcessing(false);
    };

    useEffect(() => {
        if (props.success === 'Successfully Authenticated') {
            setProcessing(true);
            setRedirect(true);
            router.get('/dashboard');
        }
    }, [props.success]);

    const lightBackgroundImage = 'https://i.ibb.co/xqd8t98/image-2024-12-17-105608122.png';
    const darkBackgroundImage = 'https://images4.alphacoders.com/131/thumb-1920-1318503.jpeg';

    return (
        <>
            <Head title="Login" />

            <>
            <AlertDialog open={Modal} onOpenChange={setModal}>
                <AlertDialogContent className="max-w-[425px]">
                    <AlertDialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20">
                        <LucideCheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <AlertDialogTitle className="text-xl font-semibold">
                        New credentials
                        </AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="pt-4 text-base">
                        You have been given a new set of credentials to login with, Do you trust to login with these credentials. Please check before logging in.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-lg">Yes, understood</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            </>
            <>
            <AlertDialog open={Redirect} onOpenChange={setRedirect}>
                <AlertDialogContent className="max-w-[425px]">
                    <AlertDialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20">
                        <LucideCheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <AlertDialogTitle className="text-xl font-semibold">
                        Woohoo! You're in! 
                        </AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="pt-4 text-base">
                        Redirecting you to the dashboard... 
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-lg">Understood!</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            </>
            <div 
                className="min-h-screen w-full bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center px-4 transition-all duration-300"
                style={{
                    backgroundImage: `url('${isDarkMode ? darkBackgroundImage : lightBackgroundImage}')`,
                    backgroundColor: isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.6)',
                    backgroundBlendMode: 'overlay',
                }}
            >
                <div className="relative w-full max-w-[1000px] flex flex-col items-center justify-center">
                    {AppConfig.appTheme === 'anime' && (
                        <div className="hidden lg:block lg:absolute lg:-left-[200px] xl:-left-[70px] top-0 z-0">
                            <img
                                src="https://i.ibb.co/BjKbhCJ/4d0d1fe8-Nero20-AI-image-denoiser-AI-Anime-bg-remov.png"
                                alt="Login visual"
                                className="h-[400px] xl:h-[600px] w-auto object-contain animate-float"
                            />
                        </div>
                    )}

                    <Card className={`w-full max-w-[450px] lg:max-w-[650px] p-4 sm:p-6 lg:p-8 transition-colors duration-300 z-10 dark:bg-black bg-white `}>
                        {errors && Object.keys(errors).length > 0 && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    {Object.values(errors).join(', ')}
                                </AlertDescription>
                            </Alert>
                        )}

                        <CardHeader className="space-y-2">
                            <CardTitle className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {AppConfig.appName}
                            </CardTitle>
                            <CardDescription className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                Sign in to your account with your credentials
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-6 mt-4">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="user" className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                        Email
                                    </Label>
                                    <div className="relative">
                                        <User2 className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                        <Input
                                            id="user"
                                            type="email"
                                            placeholder="example@example.com"
                                            value={data.user}
                                            onChange={e => setData('user', e.target.value)}
                                            className={`pl-10 h-12 w-full ${isDarkMode ? 'bg-zinc-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                            disabled={processing}
                                        />
                                    </div>
                                    {errors.user && <p className="text-sm text-red-500">{errors.user}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password" className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                        Password
                                    </Label>
                                    <div className="relative">
                                        <KeyRound className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={data.password}
                                            onChange={e => setData('password', e.target.value)}
                                            className={`pl-10 h-12 w-full ${isDarkMode ? 'bg-zinc-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                            disabled={processing}
                                        />
                                        <Button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:bg-transparent"
                                            variant="ghost"
                                        >
                                            {showPassword ? (
                                                <Eye className={`h-4 w-4 ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`} />
                                            ) : (
                                                <EyeOff className={`h-4 w-4 ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`} />
                                            )}
                                        </Button>
                                    </div>
                                    {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                                </div>

                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className={`w-full h-12 text-lg font-medium transition-all duration-300 hover:scale-[1.02] bg-black dark:bg-white `}
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Logging in...
                                        </>
                                    ) : (
                                        'Login'
                                    )}
                                </Button>
                                {AppConfig.appLogin === 'DISCORD' && (
                                    <>
                                        <Separator/>
                                        <CardTitle className={`text-xl font-bold text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Login with other providers
                            </CardTitle>
                                        <Button
                                            type="button"
                                            onClick={() => window.location.href = '/auth/discord'}
                                            className="w-full h-12 text-lg font-medium transition-all duration-300 hover:scale-[1.02] text-white dark:text-black flex items-center justify-center gap-2"
                                        >
                                            <DiscordLogoIcon className="h-5 w-5" />
                                            Login with Discord
                                        </Button>
                                    </>
                                )}
                            </form>
                        </CardContent>
                    </Card>

                    {/* Dark Mode Toggle pLEASE replace Soon */}

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
                <LucideSunMoon className="w-3 h-3 text-black" />
            )}
        </div>
    </button>
</div>
                </div>
            </div>
        </>
    );
};

export default Login;