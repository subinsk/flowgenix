import { Handle, Position, Connection, Edge } from "@xyflow/react"
import { NODE_TYPE_MAP } from "@/constants"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface ConnectableNode {
    id: string;
    label: string;
    icon: React.ComponentType<any>;
}

export const CustomHandle = ({
    type,
    position,
    id,
    label,
    className = "",
    style = {},
    showTooltipProp = true,
    tooltipComponents,
    isValidConnection: customValidation,
    labelClassname = "",
    ...props
}: {
    type: 'source' | 'target';
    position: Position;
    id?: string;
    label?: string | React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    showTooltipProp?: boolean;
    tooltipComponents?: Array<any>;
    isValidConnection?: (connection: Connection | Edge) => boolean;
    labelClassname?: string;
    [key: string]: any;
}) => {
    const [showTooltip, setShowTooltip] = useState(false);

    const defaultValidation = (connection: Connection | Edge): boolean => {
        if (!connection.source || !connection.target) return false;

        const sourceNode = document.querySelector(`[data-id="${connection.source}"]`);
        const targetNode = document.querySelector(`[data-id="${connection.target}"]`);

        if (!sourceNode || !targetNode) return false;

        const sourceInnerDiv = sourceNode.querySelector('[data-nodetype]');
        const targetInnerDiv = targetNode.querySelector('[data-nodetype]');

        const sourceType = sourceInnerDiv?.getAttribute('data-nodetype') as keyof typeof NODE_TYPE_MAP;
        const targetType = targetInnerDiv?.getAttribute('data-nodetype') as keyof typeof NODE_TYPE_MAP;

        if (!sourceType || !targetType) return false;

        // Handle specific connections for LLM Engine with multiple input handles
        if (targetType === 'llmEngine' && connection.targetHandle) {
            if (connection.targetHandle === 'context') {
                return sourceType === 'knowledgeBase';
            } else if (connection.targetHandle === 'query') {
                return sourceType === 'userQuery';
            }
        }

        // General validation using NODE_TYPE_MAP
        const sourceNodeConfig = NODE_TYPE_MAP[sourceType];
        const targetNodeConfig = NODE_TYPE_MAP[targetType];

        const canConnect = sourceNodeConfig.outputs?.some(output => output.id === targetType) || false;
        const canAccept = targetNodeConfig.inputs?.some(input => input.id === sourceType) || false;

        return canConnect && canAccept;
    };

    const validationFunction = customValidation || defaultValidation;

    return (
        <div className={`flex items-center gap-2 ${labelClassname}`}>
            {/* Label after handle for source/right handles */}
            {label && (type === 'source' || position === Position.Right) && (
                <div className="text-xs ml-2 px-2 py-1 text-muted-foreground font-medium">
                    {label}
                </div>
            )}

            <div
                className="relative"
                onMouseEnter={() => showTooltipProp && setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                <Handle
                    type={type}
                    position={position}
                    id={id}
                    className={`!w-3 !h-3 !bg-transparent !border-2 !border-primary hover:!border-primary/80 transition-colors duration-200 ${className}`}
                    style={{
                        background: 'transparent',
                        borderRadius: '50%',
                        ...style
                    }}
                    isValidConnection={validationFunction}
                    {...props}
                />

                {/* Tooltip */}
                {showTooltip && tooltipComponents && (
                    <AnimatePresence>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            className={`absolute z-50 bg-popover border border-border rounded-lg shadow-lg p-2 min-w-[200px] ${position === Position.Left ? 'right-6' : 'left-6'
                                } top-1/2 -translate-y-1/2`}
                        >
                            <div className="text-xs flex flex-col gap-2 w-full">
                                <div className="font-semibold mb-1">Can connect to:</div>
                                {
                                    tooltipComponents.map((component, index) => {
                                        const Icon = NODE_TYPE_MAP[component].icon
                                        return (
                                            <div key={index} className="flex items-center gap-2">
                                                <Icon className={`w-4 h-4 text-[#444444]/80 ${component.label === "Output" ? "scale-x-[-1]" : ""}`} />
                                                <span>
                                                    {NODE_TYPE_MAP[component]?.label}
                                                </span>
                                            </div>
                                        )
                                    })
                                }
                            </div>
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
            {/* Label before handle for target/left handles */}
            {label && (type === 'target' || position === Position.Left) && (
                <div className="text-xs mr-2 px-2 py-1 text-muted-foreground font-medium">
                    {label}
                </div>
            )}
        </div>
    );
};
