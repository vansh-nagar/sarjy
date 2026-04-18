import { create } from "zustand";
import axios from "axios";
import { toast } from "sonner";
import { type SarjyAgentState } from "@/hooks/use-agent-audio-visualizer-aura";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  textAreaInput: string;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setTextAreaInput: (input: string) => void;
  clearHistory: () => void;
  startListening: (
    onVolume: (v: number) => void,
    onsubmit: (t: string) => void,
  ) => Promise<void>;
  stopListening: (onVolume?: (v: number) => void) => void;
  onsubmit: (
    input: string,
    onState: (s: SarjyAgentState) => void,
    onVolume: (v: number) => void,
  ) => Promise<void>;
}

const refs = {
  recognizer: null as any,
  audio: null as HTMLAudioElement | null,
  audioContext: null as AudioContext | null,
  analyser: null as AnalyserNode | null,
  animationFrame: null as number | null,
};

const updateVolume = (
  analyser: AnalyserNode | null,
  callback: (v: number) => void,
) => {
  if (!analyser) return;
  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(data);
  const avg = data.reduce((p, c) => p + c, 0) / data.length;
  callback(avg / 128);
  refs.animationFrame = requestAnimationFrame(() =>
    updateVolume(analyser, callback),
  );
};

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  isRecording: false,
  isProcessing: false,
  textAreaInput: "",

  setMessages: (messages) => {
    set({ messages });
    localStorage.setItem("sarjy-chat-history", JSON.stringify(messages));
  },

  addMessage: (msg) => {
    const messages = [...get().messages, msg];
    set({ messages });
    localStorage.setItem("sarjy-chat-history", JSON.stringify(messages));
  },

  setTextAreaInput: (val) => set({ textAreaInput: val }),

  clearHistory: () => {
    set({ messages: [] });
    localStorage.removeItem("sarjy-chat-history");
    toast.success("History cleared");
  },

  stopListening: (onVolume) => {
    if (refs.recognizer) {
      refs.recognizer.stopContinuousRecognitionAsync(() => {
        refs.recognizer.close();
        refs.recognizer = null;
      });
    }
    set({ isRecording: false, isProcessing: false });
    if (refs.animationFrame) cancelAnimationFrame(refs.animationFrame);
    onVolume?.(0);
  },

  startListening: async (onVolume, onsubmit) => {
    try {
      set({ isProcessing: true });
      const {
        data: { token, region },
      } = await axios.get("/api/azure-token");

      const sdk = await import("microsoft-cognitiveservices-speech-sdk");
      const config = sdk.SpeechConfig.fromAuthorizationToken(token, region);
      config.speechRecognitionLanguage = "en-US";

      const recognizer = new sdk.SpeechRecognizer(
        config,
        sdk.AudioConfig.fromDefaultMicrophoneInput(),
      );
      refs.recognizer = recognizer;
      set({ isRecording: true, isProcessing: false });

      recognizer.recognizing = (_, e) => set({ textAreaInput: e.result.text });
      recognizer.recognized = (_, e) => {
        if (
          e.result.reason === sdk.ResultReason.RecognizedSpeech &&
          e.result.text
        ) {
          set({ textAreaInput: "" });
          onsubmit(e.result.text);
        }
      };
      recognizer.startContinuousRecognitionAsync(() =>
        toast.success("Listening..."),
      );
    } catch (err) {
      set({ isRecording: false, isProcessing: false });
    }
  },

  onsubmit: async (input, onState, onVolume) => {
    const state = get();
    if (!input.trim() || state.isLoading) return;

    state.stopListening(onVolume);
    set({ isLoading: true });
    state.addMessage({ role: "user", content: input });

    try {
      const { data } = await axios.post("/api/chat", {
        message: input,
        messages: state.messages.slice(-10),
      });

      if (data.reply)
        state.addMessage({ role: "assistant", content: data.reply });
      if (data.audio) {

        //converting base 64 to playable file
        const audioUrl = URL.createObjectURL(
          (
            await axios.get(`data:audio/mp3;base64,${data.audio}`, {
              responseType: "blob",
            })
          ).data,
        );
        // stop old
        refs.audio?.pause();
        const audio = (refs.audio = new Audio(audioUrl));

        const ctx = (refs.audioContext ||= new (
          window.AudioContext || (window as any).webkitAudioContext
        )());

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        ctx.createMediaElementSource(audio).connect(analyser);
        analyser.connect(ctx.destination);
        refs.analyser = analyser;

        audio.onplay = () => {
          onState("speaking");
          updateVolume(analyser, onVolume);
        };
        audio.onended = () => {
          onState("idle");
          onVolume(0);
          if (refs.animationFrame) cancelAnimationFrame(refs.animationFrame);
        };
        audio.play();
      }
    } catch (err) {
      toast.error("Failed to get response");
    } finally {
      set({ isLoading: false });
    }
  },
}));
