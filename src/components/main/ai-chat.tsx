"use client";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";

import { Response } from "@/components/ai-elements/response";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, Mic, MicOff, Send, Trash2 } from "lucide-react";
import React, { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Textarea } from "../ui/textarea";



const AIChat = () => {
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [textAreaInput, setTextAreaInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognizer, setRecognizer] = useState<any>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const onsubmit = useCallback(
    async (input: string) => {
      if (!input.trim() || isLoading) return;

      setIsLoading(true);
      const userMessage = { role: "user" as const, content: input };
      setMessages((prev) => [...prev, userMessage]);

      try {
        const historyContext = messagesRef.current.slice(-10);

        const response = await axios.post(
          "/api/chat",
          {
            message: input,
            messages: historyContext,
            memoryContext: "User is interacting with Sarjy, a voice companion.",
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        const data = response.data;

        if (data.reply) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.reply },
          ]);
        }

        if (data.audio) {
          const audioResponse = await axios.get(
            `data:audio/mp3;base64,${data.audio}`,
            {
              responseType: "blob",
            },
          );
          const audioBlob = audioResponse.data;
          const audioUrl = URL.createObjectURL(audioBlob);

          if (audioRef.current) {
            audioRef.current.pause();
          }

          const audio = new Audio(audioUrl);
          audioRef.current = audio;
          audio
            .play()
            .catch((err) => console.error("Audio playback error:", err));
        }
      } catch (error: any) {
        console.error("Chat error:", error);
        toast.error(error.message || "Something went wrong. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading],
  );

  const stopListening = useCallback(() => {
    if (recognizer) {
      recognizer.stopContinuousRecognitionAsync(
        () => {
          recognizer.close();
          setRecognizer(null);
        },
        (err: any) => console.error("Stop error:", err),
      );
    }
    setIsRecording(false);
    setIsProcessing(false);
  }, [recognizer]);

  const startListening = useCallback(async () => {
    try {
      setIsProcessing(true);

      const tokenResponse = await axios.get("/api/azure-token");
      const { token, region } = tokenResponse.data;

      const sdk = await import("microsoft-cognitiveservices-speech-sdk");
      const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(
        token,
        region,
      );
      speechConfig.speechRecognitionLanguage = "en-US";

      const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
      const speechRecognizer = new sdk.SpeechRecognizer(
        speechConfig,
        audioConfig,
      );

      setRecognizer(speechRecognizer);
      setIsRecording(true);
      setIsProcessing(false);

      speechRecognizer.recognizing = (_: any, e: any) => {
        if (e.result.text) {
          setTextAreaInput(e.result.text);
        }
      };

      speechRecognizer.recognized = (_: any, e: any) => {
        if (
          e.result.reason === sdk.ResultReason.RecognizedSpeech &&
          e.result.text
        ) {
          setTextAreaInput("");
          onsubmit(e.result.text);
        }
      };

      speechRecognizer.canceled = () => {
        setIsRecording(false);
      };

      speechRecognizer.startContinuousRecognitionAsync(
        () => {
          toast.success("Listening... Speak now");
        },
        (err: any) => {
          console.error("Recognition error:", err);
          setIsRecording(false);
          setIsProcessing(false);
          toast.error("Failed to start voice recognition");
        },
      );
    } catch (err) {
      console.error("Azure SDK error:", err);
      setIsRecording(false);
      setIsProcessing(false);
    }
  }, [onsubmit]);

  const toggleRecording = () => {
    if (isRecording) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSend = () => {
    if (isLoading || !textAreaInput.trim()) return;
    const message = textAreaInput.trim();

    if (isRecording) {
      stopListening();
    }

    setTextAreaInput("");
    onsubmit(message);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    const savedHistory = localStorage.getItem("sarjy-chat-history");
    if (savedHistory) {
      try {
        setMessages(JSON.parse(savedHistory));
      } catch (error) {
        console.error("Error loading chat history:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("sarjy-chat-history", JSON.stringify(messages));
    }
  }, [messages]);

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem("sarjy-chat-history");
    toast.success("Chat history cleared");
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        150,
      )}px`;
    }
  }, [textAreaInput]);

  useEffect(() => {
    return () => {
      if (recognizer) {
        recognizer.stopContinuousRecognitionAsync(() => recognizer.close());
      }
    };
  }, [recognizer]);

  return (
    <div className="flex flex-col h-[calc(100vh-90px)] relative">
      <div className="flex justify-end mb-2">
        {messages.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearHistory}
            className="text-xs text-muted-foreground hover:text-destructive flex gap-2"
          >
            <Trash2 className="h-3 w-3" />
            Clear History
          </Button>
        )}
      </div>

      <Conversation className="w-full flex-1 mb-20 mask-b-from-98 ">
        <ConversationContent className="p-0 pb-20">
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<MessageSquare className="size-12" />}
              title="No messages yet"
              description="Let's get started! Type or use voice input to chat with Sarjy."
            />
          ) : (
            messages.map((message, index) => (
              <Message from={message.role} key={index}>
                <MessageContent>
                  <Response>{message.content}</Response>
                </MessageContent>
              </Message>
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {isRecording && (
        <p className="text-xs text-muted-foreground mt-2 text-center animate-pulse relative flex justify-center items-center gap-2">
          Recording... Auto-send after silence{" "}
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </p>
      )}

      {!isRecording && textAreaInput && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Press Enter to send • Shift + Enter for new line
        </p>
      )}

      <div className="flex gap-2 items-end mt-2 absolute bottom-0 inset-x-2">
        <div className="flex-1 relative h-full overflow-hidden rounded-md">
          <Textarea
            ref={textareaRef}
            className="rounded-lg resize-none pr-3 min-h-20 max-h-20"
            placeholder={
              isProcessing
                ? "Processing voice..."
                : isRecording
                  ? "Listening... Speak now"
                  : "Type your answer or use voice input..."
            }
            value={textAreaInput}
            onChange={(e) => setTextAreaInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || isRecording}
            rows={1}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={toggleRecording}
            variant={isRecording ? "destructive" : "outline"}
            size="icon"
            disabled={isLoading}
            title={isRecording ? "Stop recording" : "Start voice input"}
          >
            {isProcessing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isRecording ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>

          <Button
            onClick={handleSend}
            variant="default"
            size="icon"
            disabled={isLoading || !textAreaInput.trim() || isRecording}
            title={isRecording ? "Auto-send enabled" : "Send message (Enter)"}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
