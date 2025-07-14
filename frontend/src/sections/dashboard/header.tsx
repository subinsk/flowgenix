import { Logo } from '@/components/common/logo';
import { DropdownMenuTrigger, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function DashboardHeader() {
    // hooks
    const router = useRouter();
    const { user, logout } = useAuth();
    const [userEmail, setUserEmail] = useState<string | null>(null);

    // functions
    const handleLogout = async () => {
        try {
            await logout();
            router.replace('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            // Navigate to login even if logout fails
            router.replace('/login');
        }
    };

    useEffect(() => {
        // Use user from context instead of fetching
        setUserEmail(user?.email || null);
    }, [user]);

    return (
        <header className="border-b border-border bg-card">
            <div className="max-w-7xl mx-auto px-[51px] py-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                        >
                            <Logo type="dark" variant='small' className='h-[25px] w-[25px]'/>
                        </motion.div>
                        <div>
                            <h1 className="text-lg font-semibold text-foreground">GenAI Stack</h1>
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <span className="text-xl cursor-pointer font-semibold text-white bg-primary rounded-full w-10 h-10 flex items-center justify-center">
                                {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
                            </span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-48">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <div>
                                <p className='text-gray-500 text-sm pl-2'>{userEmail}</p>
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout}>
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
}