export function Footer() {
    return (
        <footer className="border-t border-border py-12 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between">
                    <div className="flex items-center space-x-2 mb-4 md:mb-0">
                        <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xs">F</span>
                        </div>
                        <span className="font-semibold text-foreground">Flowgenix</span>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        © 2025 Flowgenix. Building the future of AI workflows.
                    </p>
                </div>
            </div>
        </footer>
    )
}