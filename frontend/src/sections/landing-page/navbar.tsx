import { Button } from '@/components/ui';
import { ANIMATIONS } from '@/constants';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export function Navbar() {
    // hooks
    const router = useRouter();

    return (
        <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={ANIMATIONS.SPRING_SMOOTH}
            className="relative z-50 px-6 py-4 border-b border-border"
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center space-x-2"
                >
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-bold">
                        F
                    </div>
                    <span className="text-xl font-bold text-foreground">Flowgenix</span>
                </motion.div>

                <div className="flex items-center space-x-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/login')}
                    >
                        Login
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => router.push('/register')}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        Get Started
                    </Button>
                </div>
            </div>
        </motion.nav>
    )
}