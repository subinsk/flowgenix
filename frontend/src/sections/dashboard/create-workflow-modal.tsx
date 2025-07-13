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
    Textarea,
    Separator
} from "@/components/ui";
import { AnimatePresence } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, Dispatch, SetStateAction, useEffect } from "react";
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
    mode?: 'create' | 'edit';
    isModalOpen: boolean
    selectedWorkflow?: {
        id: string;
        name: string;
        description?: string;
        status?: WorkflowStatus;
    } | null;
    setWorkflows?: Dispatch<SetStateAction<DashboardWorkflow[]>>;
    setIsModalOpen: Dispatch<SetStateAction<boolean>>

}

export function CreateWorkflowModal({ isModalOpen, setIsModalOpen, setWorkflows, selectedWorkflow, mode = "create" }: CreateWorkflowModalProps) {
    const { showSuccess, showError } = useNotifications();
    const [submitting, setSubmitting] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            workflowName: '',
            workflowDescription: '',
        },
    });

    const handleCreateWorkflow = async (values: FormValues) => {
        setSubmitting(true);
        try {
            if (mode === 'create') {
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
                    description: createdWorkflow.description || '',
                    createdAt: new Date(createdWorkflow.created_at).toLocaleDateString(),
                    updatedAt: new Date(createdWorkflow.updated_at).toLocaleDateString(),
                    status: STATUS_MAP[createdWorkflow.status as WorkflowStatus]?.label || 'unknown'
                };

                if (setWorkflows)
                    setWorkflows((prev: DashboardWorkflow[]) => [formattedWorkflow, ...prev]);

                setIsModalOpen(false);
                form.reset();
                showSuccess('Workflow Created', `"${formattedWorkflow.name}" has been created successfully!`);
            }
            else if (mode === 'edit') {
                if (!selectedWorkflow) {
                    showError('Edit Error', 'No workflow selected for editing.');
                    return;
                }

                const updatedWorkflowData = {
                    ...selectedWorkflow,
                    name: values.workflowName.trim(),
                    description: values.workflowDescription?.trim() || selectedWorkflow.description,
                };

                const updatedWorkflow = await workflowService.updateWorkflow(selectedWorkflow.id, updatedWorkflowData);

                const formattedUpdatedWorkflow: DashboardWorkflow = {
                    id: updatedWorkflow.id,
                    name: updatedWorkflow.name,
                    description: updatedWorkflow.description || '',
                    createdAt: new Date(updatedWorkflow.created_at).toLocaleDateString(),
                    updatedAt: new Date(updatedWorkflow.updated_at).toLocaleDateString(),
                    status: STATUS_MAP[updatedWorkflow.status as WorkflowStatus]?.label || 'unknown'
                };

                setIsModalOpen(false);
                showSuccess('Workflow Updated', `"${formattedUpdatedWorkflow.name}" has been updated successfully!`);
            }
        } catch (error) {
            showError(`Workflow Error`, `Failed to ${mode === 'create' ? 'create' : 'update'} workflow`);
        } finally {
            setSubmitting(false);
            form.reset();
        }
    };

    useEffect(() => {
        if (mode === 'edit' && selectedWorkflow) {
            form.reset({
                workflowName: selectedWorkflow.name,
                workflowDescription: selectedWorkflow.description || '',
            });
        }
    }, [mode, selectedWorkflow]);

    return (
        <AnimatePresence>
            {isModalOpen && (
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="max-w-md p-0 gap-0">
                        <DialogHeader className="px-5 pt-5 pb-3">
                            <DialogTitle>{mode === 'edit' ? 'Edit' : 'Create New'} Stack</DialogTitle>
                        </DialogHeader>
                        <Separator />
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(handleCreateWorkflow)}
                                className=""
                            >
                                <div className="px-5 py-5 space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="workflowName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Name</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        id="workflowName"
                                                        required
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
                                                        rows={10}
                                                        className="resize-none"
                                                        style={{
                                                            height: "183px"
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="flex justify-end w-auto space-x-3 py-4 px-4 border-t border-border">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => {
                                            setIsModalOpen(false);
                                            form.reset();
                                        }}
                                        className=""
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={submitting}
                                        className=""
                                    >
                                        {
                                            submitting ? 'Submitting...' : mode === 'edit' ? 'Update' : 'Create'
                                        }
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