"use client";

import { useRef, useEffect } from "react";
import {
  Mic,
  MicOff,
  Send,
  MessageSquare,
  MessageSquarePlus,
} from "lucide-react";
import { useChatStore } from "@/stores/use-chat-store";
import { Button } from "@/components/ui/button";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AZURE_VOICES } from "@/lib/azure-voices";
import RoseCurveIcon from "@/components/main/rose-curve-icon";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import { type SarjyAgentState } from "@/hooks/use-agent-audio-visualizer-aura";
import RoseFourLoader from "@/components/main/rose-four-loader";
import axios from "axios";

interface AIChatProps {
  onStateChange?: (s: SarjyAgentState) => void;
  onVolumeChange?: (v: number) => void;
}

const AIChat = ({ onStateChange, onVolumeChange }: AIChatProps) => {
  const {
    messages,
    sessionId,
    isLoading,
    isLoadingSession,
    isRecording,
    isProcessing,
    textAreaInput,
    voice,
    setMessages,
    setSessionId,
    setSessions,
    setTextAreaInput,
    setVoice,
    startListening,
    stopListening,
    onsubmit,
  } = useChatStore();

  const hasSession = !!sessionId;

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initRan = useRef(false);

  useEffect(() => {
    if (initRan.current) return;
    initRan.current = true;

    const init = async () => {
      try {
        const { data: sessionsData } = await axios.get("/api/sessions");
        setSessions(sessionsData.sessions);

        if (sessionsData.sessions.length === 0) return;

        const sessionId = sessionsData.sessions[0].id;
        setSessionId(sessionId);

        const { data: msgsData } = await axios.get(
          `/api/sessions/${sessionId}/messages`,
        );
        setMessages(
          msgsData.messages.map(
            (m: { role: string; content: string; createdAt?: string }) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
              createdAt: m.createdAt,
            }),
          ),
        );
      } catch {}
    };

    init();
  }, [setMessages, setSessionId, setSessions]);

  useEffect(() => {
    if (isRecording) {
      onStateChange?.("listening");
    } else if (isLoading) {
      onStateChange?.("thinking");
    } else if (isProcessing) {
      onStateChange?.("connecting");
    } else {
      onStateChange?.("idle");
      onVolumeChange?.(0);
    }
  }, [isRecording, isLoading, isProcessing, onStateChange, onVolumeChange]);

  const handleSend = () => {
    const message = textAreaInput.trim();
    if (isLoading || !message) return;

    setTextAreaInput("");
    onsubmit(
      message,
      (state) => onStateChange?.(state),
      (vol) => onVolumeChange?.(vol),
    );
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopListening(onVolumeChange);
    } else {
      startListening(
        (v) => onVolumeChange?.(v),
        (text) =>
          onsubmit(
            text,
            (s) => onStateChange?.(s),
            (v) => onVolumeChange?.(v),
          ),
      );
    }
  };

  const formatTime = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <div className="flex flex-col h-full relative ">
      {isLoadingSession && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm rounded-xl">
          <RoseFourLoader />
          <p className="text-sm text-muted-foreground">Loading chat...</p>
        </div>
      )}
      <Conversation className="w-full flex-1 mb-28 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <ConversationContent className="p-0 pb-20">
          {!hasSession ? (
            <ConversationEmptyState
              icon={<MessageSquarePlus className="size-12" />}
              title="No session selected"
              description="Create a new chat from the sidebar to get started."
            />
          ) : messages.length === 0 ? (
            <ConversationEmptyState
              icon={<MessageSquare className="size-12" />}
              title="No messages"
              description="Start chatting with Sarjy!"
            />
          ) : (
            messages.map((msg, i) => (
              <Message from={msg.role} key={i}>
                <MessageContent>
                  {msg.role === "user" ? (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  ) : (
                    <Response>{msg.content}</Response>
                  )}
                  {msg.createdAt && (
                    <p className="text-[10px] text-muted-foreground mt-1 select-none">
                      {formatTime(msg.createdAt)}
                    </p>
                  )}
                </MessageContent>
              </Message>
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="flex flex-col bg-background gap-2 border p-2 rounded-xl items-end mt-2 absolute bottom-0 inset-x-0">
        <Textarea
          ref={textareaRef}
          className="rounded-lg resize-none flex-1 min-h-16 max-h-16  border-none"
          placeholder={
            !hasSession
              ? "Create a session to start chatting..."
              : isRecording
                ? "Listening..."
                : "Type here..."
          }
          value={textAreaInput}
          onChange={(e) => setTextAreaInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={isLoading || !hasSession}
        />
        <div className="flex gap-2 items-center">
          <Select
            value={voice}
            onValueChange={setVoice}
            disabled={isLoading || !hasSession}
          >
            <SelectTrigger className="h-9 w-44 text-xs">
              <SelectValue placeholder="Voice">
                {(() => {
                  const selected = AZURE_VOICES.find((v) => v.value === voice);
                  if (!selected) return null;
                  return (
                    <span className="flex items-center gap-1.5">
                      <RoseCurveIcon variant={selected.variant} size={16} />
                      <span>
                        {selected.label} ({selected.gender})
                      </span>
                    </span>
                  );
                })()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {AZURE_VOICES.map((v) => (
                <SelectItem key={v.value} value={v.value} className="text-xs">
                  <span className="flex items-center gap-2">
                    <RoseCurveIcon variant={v.variant} size={18} />
                    <span>
                      {v.label} ({v.gender})
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={handleToggleRecording}
            variant={isRecording ? "destructive" : "outline"}
            size="icon"
            disabled={isLoading || !hasSession}
          >
            {isProcessing ? (
              <RoseFourLoader />
            ) : isRecording ? (
              <Mic />
            ) : (
              <MicOff />
            )}
          </Button>

          <Button
            onClick={handleSend}
            variant="default"
            size="icon"
            disabled={isLoading || !hasSession || !textAreaInput.trim()}
          >
            {isLoading ? <RoseFourLoader /> : <Send />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
