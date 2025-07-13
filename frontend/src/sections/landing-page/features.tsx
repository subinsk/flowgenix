import { ANIMATIONS } from '@/constants';
import { Card } from '@/shared/components';
import { motion } from 'framer-motion';
import {
    Workflow,
    Bot,
    BookOpen,
    Search,
    MessageCircle,
    Zap
} from 'lucide-react';

const features = [
    {
        icon: <Workflow className="w-10 h-10 text-primary" aria-label="Visual Workflow Builder" />,
        title: 'Visual Workflow Builder',
        description: 'Drag and drop components to build powerful AI workflows without coding',
    },
    {
        icon: <Bot className="w-10 h-10 text-primary" aria-label="AI Integration" />,
        title: 'AI Integration',
        description: 'Seamlessly integrate with GPT, Claude, and other leading AI models',
    },
    {
        icon: <BookOpen className="w-10 h-10 text-primary" aria-label="Knowledge Base" />,
        title: 'Knowledge Base',
        description: 'Upload documents and create intelligent knowledge retrieval systems',
    },
    {
        icon: <Search className="w-10 h-10 text-primary" aria-label="Web Search" />,
        title: 'Web Search',
        description: 'Connect to real-time web search APIs for up-to-date information',
    },
    {
        icon: <MessageCircle className="w-10 h-10 text-primary" aria-label="Interactive Chat" />,
        title: 'Interactive Chat',
        description: 'Chat with your workflows and get intelligent responses',
    },
    {
        icon: <Zap className="w-10 h-10 text-primary" aria-label="Real-time Execution" />,
        title: 'Real-time Execution',
        description: 'See your workflows execute in real-time with live progress tracking',
    },
];

export function Features() {
    return (
        <section id="features" className="pt-44 pb-20 px-6 bg-white">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={ANIMATIONS.SPRING_SMOOTH}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                        Everything you need to build AI workflows
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Powerful features that make building AI workflows simple and intuitive
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, ...ANIMATIONS.SPRING_SMOOTH }}
                            viewport={{ once: true }}
                        >
                            <Card hover padding="lg" className="h-full">
                                <div className="text-4xl mb-4">{feature.icon}</div>
                                <h3 className="text-xl font-semibold text-foreground mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-muted-foreground">
                                    {feature.description}
                                </p>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}