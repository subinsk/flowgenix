import Image from "next/image";

export function Logo({
    className,
    type = "light",
    variant = "large",
    ...props
}: {
    className?: string;
    type?: "light" | "dark";
    variant?: "small" | "large";
}) {
    const getLogoSrc = () => {
        if (variant === "small") {
            return "/logo-small.png";
        }
        return type === "light" ? "/logo-light.svg" : "/logo-dark.svg";
    }

    return (
        <Image
            src={getLogoSrc()}
            alt="Logo"
            width={80}
            height={40}
            className={`h-10 w-auto ${className}`}
            {...props}
        />
    );
}