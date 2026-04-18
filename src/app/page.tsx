"use client";

import { useState } from "react";
import AIChat from "@/components/main/ai-chat";
import { AgentAudioVisualizerAura } from "@/components/agent-audio-visualizer-aura";
import { AgentAudioVisualizerRadial } from "@/components/agent-audio-visualizer-radial";
import { AgentAudioVisualizerWave } from "@/components/agent-audio-visualizer-wave";
import { AgentAudioVisualizerGrid } from "@/components/agent-audio-visualizer-grid";
import { type SarjyAgentState } from "@/hooks/use-agent-audio-visualizer-aura";
import { ModeToggle } from "@/components/ui/light-dark2.0";
import { Layers, Radius, Activity, LayoutGrid } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
      <header className="px-4 py-3 mx-3 mt-3 flex rounded-xl bg-background justify-between items-center backdrop-blur-sm sticky top-0 z-50">
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
        <ModeToggle />
      </header>

      <main className="flex-1 flex overflow-hidden bg-muted">
        <div className="flex-1 m-3 rounded-xl h-[calc(100vh-92px)]  bg-background flex flex-col justify-center items-center relative overflow-hidden">
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

        <div className="w-[400px] h-[calc(100vh-92px)]  flex flex-col p-3 bg-background mr-3 my-3 rounded-xl">
          <AIChat onStateChange={setAgentState} onVolumeChange={setVolume} />
        </div>
      </main>
    </div>
  );
};

export default Page;
