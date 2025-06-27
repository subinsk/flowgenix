import { Button } from '@/components/ui';
import { ANIMATIONS } from '@/constants';
import { motion } from 'framer-motion';

export function Hero(){
    return(
        <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={ANIMATIONS.SPRING_SMOOTH}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, ...ANIMATIONS.SPRING_SMOOTH }}
              className="mb-8"
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-muted text-foreground text-sm font-medium border border-border">
                🚀 Now in Beta - Try it free!
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, ...ANIMATIONS.SPRING_SMOOTH }}
              className="text-4xl md:text-6xl font-bold text-foreground mb-6"
            >
              Build AI Workflows
              <br />
              <span className="text-muted-foreground">
                Visually
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, ...ANIMATIONS.SPRING_SMOOTH }}
              className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
            >
              Create powerful AI workflows without coding. Drag, drop, and connect components 
              to build intelligent systems that understand your data and respond to your users.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, ...ANIMATIONS.SPRING_SMOOTH }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button
                variant="default"
                size="lg"
                className="min-w-[200px]"
              >
                Start Building Free
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Learn More
              </Button>
            </motion.div>
          </motion.div>
        </div>

        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"></div>
        </div>
      </div>
    )
}