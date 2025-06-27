import { MessageSquare } from "lucide-react";
import { NodeWrapper } from "@/components";

export const UserQueryNode = ({ id, data, selected }: any) => {
  return (
    <NodeWrapper
      type="userQuery"
      selected={selected}
      hasTarget={false}
      onSettings={data?.onSettings}
      onDelete={data?.onDelete}
      id={id}
      validationErrors={[]}
    >
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-foreground">User Query</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Query Input</label>
            <textarea
              className="w-full p-2 text-sm bg-muted border border-border rounded resize-none nodrag text-muted-foreground"
              placeholder="User input will come from chat"
              rows={2}
              value={''}
              disabled
              readOnly
              onMouseDown={(e) => e.stopPropagation()}
              onFocus={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <div className="text-xs px-2 py-1 bg-blue-500 text-white rounded">Entry Point</div>
        </div>
      </div>
    </NodeWrapper>
  );
};