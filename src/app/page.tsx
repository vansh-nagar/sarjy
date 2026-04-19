"use client";

import { useState } from "react";
import AIChat from "@/components/main/ai-chat";
import { AgentAudioVisualizerAura } from "@/components/agent-audio-visualizer-aura";
import { AgentAudioVisualizerRadial } from "@/components/agent-audio-visualizer-radial";
import { AgentAudioVisualizerWave } from "@/components/agent-audio-visualizer-wave";
import { AgentAudioVisualizerGrid } from "@/components/agent-audio-visualizer-grid";
import { type SarjyAgentState } from "@/hooks/use-agent-audio-visualizer-aura";
import { ModeToggle } from "@/components/ui/light-dark2.0";
import { Lock, Layers, Radius, Activity, LayoutGrid } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Show,
  SignInButton,
  SignOutButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

const Page = () => {
  const [agentState, setAgentState] = useState<SarjyAgentState>("idle");
  const [volume, setVolume] = useState(0);
  const [visualizerType, setVisualizerType] = useState<
    "aura" | "radial" | "wave" | "grid"
  >("radial");

  const getStateColor = (state: SarjyAgentState) => {
    switch (state) {
      case "idle":
        return "#A78BFA";
      case "listening":
        return "#8B5CF6";
      case "thinking":
        return "#7C3AED";
      case "speaking":
        return "#6D28D9";
      case "connecting":
        return "#C084FC";
      case "error":
        return "#EF4444";
      default:
        return "#8B5CF6";
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-muted text-foreground transition-colors duration-300">
      <header className="px-4 py-3 mx-3 mt-3 flex rounded-xl premium-container justify-between items-center sticky top-0 z-50 transition-all duration-300">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold tracking-tight">Sarjy :)</h1>
        </div>
        <Tabs
          value={visualizerType}
          onValueChange={(v) => setVisualizerType(v as any)}
          className="w-auto"
        >
          <TabsList>
            <TabsTrigger value="aura" className="gap-2">
              <Layers className="h-4 w-4" />
              Aura
            </TabsTrigger>
            <TabsTrigger value="radial" className="gap-2">
              <Radius className="h-4 w-4" />
              Radial
            </TabsTrigger>
            <TabsTrigger value="wave" className="gap-2">
              <Activity className="h-4 w-4" />
              Wave
            </TabsTrigger>
            <TabsTrigger value="grid" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Grid
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <Show when="signed-out">
            <SignInButton>
              <Button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton>
              <Button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                Sign Up
              </Button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <SignOutButton>
              <Button variant={"destructive"}>Sign Out</Button>
            </SignOutButton>
          </Show>
          <ModeToggle />
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden bg-muted">
        <div className="flex-1 m-3 rounded-xl h-[calc(100vh-92px)] premium-container flex flex-col justify-center items-center relative overflow-hidden transition-all duration-300">
          {visualizerType === "aura" ? (
            <AgentAudioVisualizerAura
              size="xl"
              state={agentState}
              volume={volume}
              color={getStateColor(agentState) as `#${string}`}
              colorShift={0}
              themeMode="light"
              className="w-[min(95vw,600px)] h-[min(95vw,600px)] opacity-30"
            />
          ) : visualizerType === "radial" ? (
            <AgentAudioVisualizerRadial
              size="xl"
              state={agentState}
              volume={volume}
              color={getStateColor(agentState) as `#${string}`}
              className="w-[min(95vw,600px)] h-[min(95vw,600px)]"
            />
          ) : visualizerType === "wave" ? (
            <AgentAudioVisualizerWave
              size="xl"
              state={agentState}
              volume={volume}
              color={getStateColor(agentState) as `#${string}`}
              className="w-[min(95vw,600px)] h-[min(95vw,600px)]"
            />
          ) : (
            <AgentAudioVisualizerGrid
              size="xl"
              state={agentState}
              volume={volume}
              color={getStateColor(agentState) as `#${string}`}
              className="h-auto w-auto scale-150"
            />
          )}
        </div>

        <div className="w-[400px] h-[calc(100vh-92px)] flex flex-col p-3 premium-container mr-3 my-3 rounded-xl relative overflow-hidden transition-all duration-300 shadow-2xl">
          <Show when="signed-in">
            <AIChat onStateChange={setAgentState} onVolumeChange={setVolume} />
          </Show>
          <Show when="signed-out">
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
              <div className=" glass-overlay p-8 rounded-3xl flex flex-col items-center gap-5 max-w-[85%] text-center">
                <div className="w-20 glass-overlay h-20 rounded-full flex items-center justify-center ring-4 ring-primary/5">
                  <Lock className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black tracking-tight">
                    Sarjy Assistant is Locked
                  </h3>
                </div>
                <SignInButton mode="modal">
                  <Button size="lg">Sign In to Unlock</Button>
                </SignInButton>
                <p className="text-xs text-muted-foreground/60">
                  Don't have an account?{" "}
                  <SignUpButton mode="modal">
                    <span className="text-primary font-semibold hover:underline cursor-pointer">
                      Sign up free
                    </span>
                  </SignUpButton>
                </p>
              </div>
            </div>
            {/* Decorative blurred background */}
            <div className="flex-1 duration-300 opacity-10 blur-xl pointer-events-none select-none grayscale transform scale-110">
              <AIChat onStateChange={() => {}} onVolumeChange={() => {}} />
            </div>
          </Show>
        </div>
      </main>
    </div>
  );
};

export default Page;
