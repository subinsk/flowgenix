import { Button } from '@/components/ui';
import { ANIMATIONS } from '@/constants';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Typewriter from "typewriter-effect";

export function Hero() {
  const router = useRouter();
  const bannerItems = [
    {
      title: "20x",
      description: "Faster time to market",
    },
    {
      title: "upto 30x",
      description: "Infra Cost Savings",
    },
    {
      title: "10x",
      description: "10x Productivity Gains",
    },
  ]

  const servicesItems = [
    {
      name: "RAG Apps",
    },
    {
      name: "LLM Apps"
    },
    {
      name: "AI Models"
    },
    {
      name: "GenAI Apps",
    },
    {
      name: "Agents",
    },

  ]
  return (
    <div className="relative bg-accent-background">
      <div className="max-w-7xl mx-auto px-6 pt-20 pb-48">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={ANIMATIONS.SPRING_SMOOTH}
          className="text-center"
        >

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, ...ANIMATIONS.SPRING_SMOOTH }}
            className="text-4xl md:text-6xl leading-20 font-bold text-white mb-6 flex flex-col items-center"
          >
            <div className="flex items-center space-x-6">
              <span>
                Deploy
              </span>
              <div className="text-[#ffdf99] min-w-96 w-8min-w-96 text-left">
                <Typewriter
                  options={{ cursor: "|", autoStart: true, loop: true, delay: 100, strings: servicesItems.map(item => item.name) }}
                />
              </div>
            </div>
            <span className="">
              in minutes, not months.
            </span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, ...ANIMATIONS.SPRING_SMOOTH }}
            className="text-xl text-[#CCCCCC] mb-8 max-w-2xl mx-auto"
          >
            Integrate reliable, private and secure GenAI solutions within your enterprise environment
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
              className="bg-white text-[#333332] border-none hover:bg-white/80"
              onClick={() => { router.push('/register') }}
            >
              Get Started
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className='bg-[#ffffff40] text-white border-none hover:bg-[#ffffff40]/80 hover:text-white'
            >
              Book Demo
            </Button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, ...ANIMATIONS.SPRING_SMOOTH }} className="absolute z-10 left-1/6 -bottom-16 rounded-2xl flex items-center space-x-4 bg-[#042836]">
            {
              bannerItems.map((item, index) => (
                <>
                  <div key={index} className="flex flex-col space-y-4 px-16 py-8">
                    <span className='text-4xl font-medium text-[#d9f5ff]'>{item.title}</span>
                    <span className='text-[#ffffffa8]'>{item.description}</span>
                  </div>
                  {
                    (index !== 0 || index !== bannerItems.length - 1) ? <div className="w-px h-16 bg-[#ffffff40]" /> : null
                  }
                </>
              ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}