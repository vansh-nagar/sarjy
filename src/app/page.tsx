import React from "react";
import AIChat from "@/components/main/ai-chat";

const Page = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="p-4 border-b flex justify-between items-center">
        <h1 className="text-2xl font-bold">Sarjy :)</h1>
      </header>
      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col justify-center items-center border-r">
          <h2 className="text-xl text-muted-foreground italic">"I'm listening..."</h2>
          {/* Future home for visualizer */}
        </div>
        <div className="w-[400px] flex flex-col p-3">
          <AIChat />
        </div>
      </main>
    </div>
  );
};

export default Page;
