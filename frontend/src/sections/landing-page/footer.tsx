import { Logo } from "@/components/common/logo";

export function Footer() {
    return (
        <footer className="border-t border-border py-12 px-6 bg-white">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between">
                    <Logo type="dark"/>
                    <p className="text-muted-foreground text-sm">
                        © 2025 AI Planet. Building the future of AI workflows.
                    </p>
                </div>
            </div>
        </footer>
    )
}