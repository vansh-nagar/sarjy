"use client";

import { useRef, useEffect } from "react";
import {
  Mic,
  MicOff,
  Send,
  Trash2,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { useChatStore } from "@/stores/use-chat-store";
import { Button } from "@/components/ui/button";
import { Textarea } from "../ui/textarea";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import { type SarjyAgentState } from "@/hooks/use-agent-audio-visualizer-aura";

interface AIChatProps {
  onStateChange?: (s: SarjyAgentState) => void;
  onVolumeChange?: (v: number) => void;
}

const AIChat = ({ onStateChange, onVolumeChange }: AIChatProps) => {
  const {
    messages,
    isLoading,
    isRecording,
    isProcessing,
    textAreaInput,
    setMessages,
    setTextAreaInput,
    clearHistory,
    startListening,
    stopListening,
    onsubmit,
  } = useChatStore();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("sarjy-chat-history");
    if (saved) {
      setMessages(JSON.parse(saved));
    }
  }, [setMessages]);

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

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex justify-end mb-2">
        {messages.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearHistory}
            className="text-xs flex gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Clear History
          </Button>
        )}
      </div>

      <Conversation className="w-full  flex-1 mb-20 custom-scrollbar">
        <ConversationContent className="p-0 pb-20">
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<MessageSquare className="size-12" />}
              title="No messages"
              description="Start chatting with Sarjy!"
            />
          ) : (
            messages.map((msg, i) => (
              <Message from={msg.role} key={i}>
                <MessageContent>
                  <Response>{msg.content}</Response>
                </MessageContent>
              </Message>
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="flex gap-2 items-end mt-2 absolute bottom-0 inset-x-0">
        <Textarea
          ref={textareaRef}
          className="rounded-lg resize-none flex-1 min-h-[70px]"
          placeholder={isRecording ? "Listening..." : "Type here..."}
          value={textAreaInput}
          onChange={(e) => setTextAreaInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={isLoading}
        />

        <div className="flex flex-col gap-2">
          <Button
            onClick={handleToggleRecording}
            variant={isRecording ? "destructive" : "outline"}
            size="icon"
            disabled={isLoading}
          >
            {isProcessing ? (
              <Loader2 className="animate-spin" />
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
            disabled={isLoading || !textAreaInput.trim()}
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <Send />}

          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
