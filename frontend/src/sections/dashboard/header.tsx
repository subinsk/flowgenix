import { Button } from '@/components/ui';
import { authService } from '@/services';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export function DashboardHeader() {
    // hooks
    const router = useRouter();

    // functions
    const handleLogout = async () => {
        await authService.logout();
        router.push('/login');
    };
    
    return (
        <header className="border-b border-border bg-card">
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-bold"
                        >
                            F
                        </motion.div>
                        <div>
                            <h1 className="text-xl font-semibold text-foreground">Flowgenix</h1>
                            <p className="text-sm text-muted-foreground">Dashboard</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleLogout}
                        >
                            Logout
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    )
}