import {
    Button,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
    Input,
    Textarea
} from "@/components/ui";
import { AnimatePresence } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, Dispatch, SetStateAction } from "react";
import { useNotifications } from "@/hooks";
import { workflowService } from "@/services";
import { DashboardWorkflow, Workflow, WorkflowStatus } from "@/types";
import { STATUS_MAP } from "@/constants";

const formSchema = z.object({
    workflowName: z.string().min(2, {
        message: "Workflow name must be at least 2 characters.",
    }),
    workflowDescription: z.string().max(500, {
        message: "Description must be at most 500 characters.",
    }).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateWorkflowModalProps {
    isCreateModalOpen: boolean
    selectedWorkflow?: Workflow | null;
    setWorkflows: Dispatch<SetStateAction<DashboardWorkflow[]>>;
    setIsCreateModalOpen: Dispatch<SetStateAction<boolean>>
}

export function CreateWorkflowModal({ isCreateModalOpen, setIsCreateModalOpen, setWorkflows, selectedWorkflow }: CreateWorkflowModalProps) {
    const { showSuccess, showError } = useNotifications();
    const [createLoading, setCreateLoading] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            workflowName: '',
            workflowDescription: '',
        },
    });

    const handleCreateWorkflow = async (values: FormValues) => {
        setCreateLoading(true);
        try {
            const newWorkflowData = {
                name: values.workflowName.trim(),
                description: values.workflowDescription?.trim() || undefined,
                nodes: [],
                edges: []
            };

            const createdWorkflow = await workflowService.createWorkflow(newWorkflowData);

            const formattedWorkflow: DashboardWorkflow = {
                id: createdWorkflow.id,
                name: createdWorkflow.name,
                description: createdWorkflow.description || 'No description',
                createdAt: new Date(createdWorkflow.created_at).toLocaleDateString(),
                updatedAt: new Date(createdWorkflow.updated_at).toLocaleDateString(),
                status: STATUS_MAP[createdWorkflow.status as WorkflowStatus]?.label || 'unknown'
            };
            setWorkflows((prev: DashboardWorkflow[]) => [formattedWorkflow, ...prev]);
            setIsCreateModalOpen(false);
            form.reset();
            showSuccess('Workflow Created', `"${formattedWorkflow.name}" has been created successfully!`);
        } catch (error) {
            showError('Creation Failed', 'Failed to create workflow. Please try again.');
        } finally {
            setCreateLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isCreateModalOpen && (
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Create New Workflow</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(handleCreateWorkflow)}
                                className="space-y-4"
                            >
                                <FormField
                                    control={form.control}
                                    name="workflowName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Workflow Name *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    id="workflowName"
                                                    placeholder="Enter workflow name..."
                                                    required
                                                    autoFocus
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="workflowDescription"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    {...field}
                                                    id="workflowDesc"
                                                    placeholder="Describe what this workflow does..."
                                                    rows={3}
                                                    className="resize-none"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="flex space-x-3 pt-4 border-t border-border">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setIsCreateModalOpen(false);
                                            form.reset();
                                        }}
                                        className="flex-1"
                                        disabled={createLoading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={createLoading}
                                        className="flex-1"
                                    >
                                        {createLoading ? 'Creating...' : 'Create Workflow'}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            )}
        </AnimatePresence>
    );
}