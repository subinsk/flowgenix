import { Button } from "@/components/ui";
import { ANIMATIONS } from "@/constants";
import { Card } from "@/shared/components";
import { motion } from 'framer-motion';

export function GetStarted() {
    return (
        <section className="py-20 px-6">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={ANIMATIONS.SPRING_SMOOTH}
                    viewport={{ once: true }}
                >
                    <Card padding="lg" className="text-center bg-primary text-primary-foreground">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Ready to start building?
                        </h2>
                        <p className="text-lg mb-8 opacity-90">
                            Join thousands of builders creating the future with AI workflows
                        </p>
                        <Button
                            variant="secondary"
                            size="lg"
                            className="bg-white text-primary hover:bg-gray-50"
                        >
                            Get Started Today
                        </Button>
                    </Card>
                </motion.div>
            </div>
        </section>
    )
}