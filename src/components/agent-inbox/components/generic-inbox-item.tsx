import { cn } from "@/lib/utils";
import { Thread } from "@langchain/langgraph-sdk";
import { ThreadIdCopyable } from "./thread-id";
import { InboxItemStatuses } from "./statuses";
import { format, formatDistanceToNow } from "date-fns";
import { useQueryParams } from "../hooks/use-query-params";
import {
  STUDIO_NOT_WORKING_TROUBLESHOOTING_URL,
  VIEW_STATE_THREAD_QUERY_PARAM,
} from "../constants";
import { GenericThreadData } from "../types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useThreadsContext } from "../contexts/ThreadContext";

import { constructOpenInStudioURL } from "../utils";

interface GenericInboxItemProps<
  ThreadValues extends Record<string, any> = Record<string, any>,
> {
  threadData:
  | GenericThreadData<ThreadValues>
  | {
    thread: Thread<ThreadValues>;
    status: "interrupted";
    interrupts?: undefined;
  };
  isLast: boolean;
}

export function GenericInboxItem<
  ThreadValues extends Record<string, any> = Record<string, any>,
>({ threadData, isLast }: GenericInboxItemProps<ThreadValues>) {
  const { updateQueryParams, searchParams } = useQueryParams();
  const { toast } = useToast();
  const { agentInboxes } = useThreadsContext();

  const selectedInbox = agentInboxes.find((i) => i.selected);
  const inbox = (searchParams.get('inbox') || 'interrupted') as string;

  const handleOpenInStudio = () => {
    if (!selectedInbox) {
      toast({
        title: "Error",
        description: "No agent inbox selected.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    const studioUrl = constructOpenInStudioURL(
      selectedInbox,
      threadData.thread.thread_id
    );

    if (studioUrl === "#") {
      toast({
        title: "Error",
        description: (
          <>
            <p>
              Could not construct Studio URL. Check if inbox has necessary
              details (Project ID, Tenant ID).
            </p>
            <p>
              If the issue persists, see the{" "}
              <a
                href={STUDIO_NOT_WORKING_TROUBLESHOOTING_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                troubleshooting section
              </a>
            </p>
          </>
        ),
        variant: "destructive",
        duration: 10000,
      });
    } else {
      window.open(studioUrl, "_blank");
    }
  };

  const updatedAtDateString = format(
    new Date(threadData.thread.updated_at),
    "MM/dd h:mm a"
  );

  // Email subject and triage status preview for 'all' view
  const values = threadData.thread.values || {};
  const subject = values.subject;
  const triageResponse = values.triage_response;
  const triageColor =
    triageResponse && triageResponse.toLowerCase() === 'yes'
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-gray-100 text-gray-700 border-gray-200';
  const updatedAt = threadData.thread.updated_at;
  const friendlyTime = updatedAt ? formatDistanceToNow(new Date(updatedAt), { addSuffix: true }) : null;

  return (
    <div
      onClick={() =>
        updateQueryParams(
          VIEW_STATE_THREAD_QUERY_PARAM,
          threadData.thread.thread_id
        )
      }
      className={cn(
        "w-full bg-white border rounded-xl shadow-sm transition-colors cursor-pointer hover:bg-accent/40 flex flex-col gap-2 p-2 mb-2 md:grid md:grid-cols-12 md:gap-0 md:p-4",
        !isLast && "md:border-b-[1px] border-gray-200"
      )}
    >
      <div className="hidden md:flex col-span-1 justify-center items-center" />
      <div className={cn("flex flex-col md:flex-row md:items-center gap-1 md:gap-2 md:col-span-6 w-full truncate mb-1 md:mb-0")}>
        <div className="flex items-center gap-2 w-full truncate">
          <p className="text-sm font-semibold text-black truncate">Thread ID:</p>
          <ThreadIdCopyable showUUID threadId={threadData.thread.thread_id} />
        </div>
        {/* Preview subject and triage status only in 'all' view */}
        {inbox === 'all' && (
          <div className="flex flex-col md:flex-row md:items-center gap-1 w-full">
            {subject && (
              <span className="text-xs text-gray-700 truncate">{subject}</span>
            )}
            {friendlyTime && (
              <span className="text-xs text-gray-400 ml-0 md:ml-2">{friendlyTime}</span>
            )}
            {triageResponse && (
              <span
                className={cn(
                  "inline-block px-2 py-0.5 rounded-full border text-xs font-medium ml-0 md:ml-2 w-fit",
                  triageColor
                )}
              >
                {triageResponse}
              </span>
            )}
          </div>
        )}
      </div>
      {selectedInbox && (
        <div className="flex items-center md:col-span-2 w-full mb-1 md:mb-0">
          <Button
            size="sm"
            variant="outline"
            className="flex items-center gap-1 bg-white w-full md:w-auto"
            onClick={handleOpenInStudio}
          >
            Studio
          </Button>
        </div>
      )}
      <div className={cn("flex items-center md:col-span-2 w-full mb-1 md:mb-0")}>
        <InboxItemStatuses status={threadData.status} />
      </div>
      <p className="text-right text-sm text-gray-600 font-light pt-2 md:col-span-1 w-full truncate">
        {updatedAtDateString}
      </p>
    </div>
  );
}
