"use client";

import { useState } from "react";
import AIChat from "@/components/main/ai-chat";
import SessionsSidebar from "@/components/main/sessions-sidebar";
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
import SarjyMascot from "@/components/main/sarjy-mascot";

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
    <div className="flex flex-col max-h-screen min-h-screen bg-muted  text-foreground transition-colors duration-300">
      <header className="px-4 py-3 mx-3 mt-3 flex rounded-xl bg-background border justify-between items-center sticky top-0 z-50 transition-all duration-300">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl flex gap-2 font-bold tracking-tight">
            Sarjy <SarjyMascot />
          </h1>
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
        <div className="mr-3">
          <Show when="signed-in">
            <SessionsSidebar />
          </Show>
        </div>
        <div className="flex-1 m-3 ml-0 rounded-xl h-[calc(100vh-92px)] bg-background border flex flex-col justify-center items-center relative overflow-hidden transition-all duration-300">
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

        <div className="w-[400px] bg-background border  h-[calc(100vh-92px)] flex flex-col p-3 mr-3 my-3 rounded-xl relative overflow-hidden transition-all duration-300">
          <Show when="signed-in">
            <AIChat onStateChange={setAgentState} onVolumeChange={setVolume} />
          </Show>
          <Show when="signed-out">
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
              <div className="glass-overlay p-8 rounded-3xl flex flex-col items-center gap-5 max-w-[85%] text-center">
                <div className="w-20 h-20 scale-200 rounded-full flex items-center justify-center">
                  <SarjyMascot />{" "}
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl">Sarjy Assistant is Locked</h3>
                </div>
                <SignInButton mode="modal">
                  <Button size="lg">Sign In to Unlock</Button>
                </SignInButton>
              </div>
            </div>
            {/* Decorative blurred background */}
            <div className="flex-1  duration-300  opacity-10 blur-xl pointer-events-none select-none grayscale transform scale-110">
              <AIChat onStateChange={() => {}} onVolumeChange={() => {}} />
            </div>
          </Show>
        </div>
      </main>
    </div>
  );
};

export default Page;
