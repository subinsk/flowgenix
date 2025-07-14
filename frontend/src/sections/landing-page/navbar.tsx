import { Button } from '@/components/ui';
import { ANIMATIONS } from '@/constants';
import { motion } from 'framer-motion';
import React, { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Logo } from '@/components/common/logo';

function DropdownLink({ name, children }: { name: string; children?: Array<{ name: string; link: string }> }) {
    // states
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div className="group relative" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
            <Button variant="ghost" className={`inline-flex items-center text-white hover:text-white/70 bg-transparent hover:bg-transparent focus:text-white ${!children ? 'cursor-pointer' : 'cursor-default'}`}>
                {name}
                {children && <ChevronDownIcon className={`h-4 w-4 transition-transform ${isHovered ? 'rotate-180' : ''}`} />}
            </Button>
            {
                children ?
                    <div className="absolute -left-1/3 z-10 hidden w-44 space-y-1 bg-[#022533] text-white py-2 shadow-md group-hover:block rounded-2xl">
                        {children.map((child, index) => (
                            <Link key={index} href={child.link} className="block px-4 py-2 text-sm font-semibold hover:text-white/70" prefetch={false}>
                                {child.name}
                            </Link>
                        ))}
                    </div>
                    :
                    null
            }
        </div>
    )
}

export function Navbar() {
    const navbarLinks = [
        {
            name: "Products",
            children: [
                { name: 'GenAIStack', link: '#' },
                { name: 'OpenAGI', link: '#' },
                { name: 'AI Marketplace', link: '#' }
            ]
        },
        {
            name: "Models",
            children: [
                { name: 'Effi Series', link: '#' },
                { name: 'Panda Coder', link: '#' },
            ],
        },
        {
            name: "Solutions",
            children: [
                { name: 'Banking and Finance', link: '#' },
                { name: 'Healthcare', link: '#' },
                { name: 'Pharma', link: '#' },
                { name: 'Education', link: '#' },
                { name: 'CPG', link: '#' },
            ],
        },
        {
            name: 'Community',
            link: '#'
        }
    ]

    return (
        <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={ANIMATIONS.SPRING_SMOOTH}
            className="relative z-50 px-6 py-4 bg-accent-background"
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center space-x-2"
                >
                    <Logo />
                </motion.div>

                <div className="flex items-center">
                    {
                        navbarLinks.map((link, index) => (
                            <DropdownLink key={index} name={link.name}>
                                {link.children}
                            </DropdownLink>
                        ))
                    }
                    <Button
                        size="sm"
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        Contact Us
                    </Button>
                </div>
            </div>
        </motion.nav>
    )
}