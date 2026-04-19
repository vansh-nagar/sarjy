"use client";

import { useState } from "react";
import { useChatStore } from "@/stores/use-chat-store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MessageSquarePlus, MessageSquare, Trash2, Loader2, Pencil } from "lucide-react";
import axios from "axios";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const SessionsSidebar = () => {
  const { sessions, sessionId, setSessionId, setMessages, setSessions, setIsLoadingSession } =
    useChatStore();

  const [newChatOpen, setNewChatOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [renaming, setRenaming] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      const { data } = await axios.post("/api/sessions", { title: title.trim() });
      setSessions([data.session, ...sessions]);
      setSessionId(data.session.id);
      setMessages([]);
      setTitle("");
      setNewChatOpen(false);
      toast.success("Chat created");
    } catch {
      toast.error("Failed to create chat");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmId) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/sessions/${confirmId}`);
      const next = sessions.filter((s) => s.id !== confirmId);
      setSessions(next);
      if (confirmId === sessionId) {
        if (next.length > 0) {
          setSessionId(next[0].id);
          const { data } = await axios.get(`/api/sessions/${next[0].id}/messages`);
          setMessages(
            data.messages.map((m: { role: string; content: string }) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            }))
          );
        } else {
          setSessionId("");
          setMessages([]);
        }
      }
      toast.success("Session deleted");
      setConfirmId(null);
    } catch {
      toast.error("Failed to delete session");
    } finally {
      setDeleting(false);
    }
  };

  const handleRename = async () => {
    if (!renameId || !renameTitle.trim()) return;
    setRenaming(true);
    try {
      await axios.patch(`/api/sessions/${renameId}`, { title: renameTitle.trim() });
      setSessions(sessions.map((s) => s.id === renameId ? { ...s, title: renameTitle.trim() } : s));
      toast.success("Session renamed");
      setRenameId(null);
      setRenameTitle("");
    } catch {
      toast.error("Failed to rename session");
    } finally {
      setRenaming(false);
    }
  };

  const handleSelectSession = async (id: string) => {
    if (id === sessionId) return;
    setSessionId(id);
    setIsLoadingSession(true);
    try {
      const { data } = await axios.get(`/api/sessions/${id}/messages`);
      setMessages(
        data.messages.map((m: { role: string; content: string; createdAt?: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
          createdAt: m.createdAt,
        }))
      );
    } catch {
      setMessages([]);
    } finally {
      setIsLoadingSession(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const confirmSession = sessions.find((s) => s.id === confirmId);

  return (
    <>
      <div className="w-56 bg-background border h-[calc(100vh-92px)] flex flex-col ml-3 my-3 rounded-xl overflow-hidden shrink-0">
        <div className="p-3 border-b">
          <Button
            onClick={() => setNewChatOpen(true)}
            variant="outline"
            className="w-full justify-start gap-2 text-sm"
          >
            <MessageSquarePlus className="h-4 w-4 shrink-0" />
            New Chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {sessions.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center pt-6 px-3">
              No chats yet. Create your first one!
            </p>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => handleSelectSession(s.id)}
                className={cn(
                  "group w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-1 cursor-pointer",
                  s.id === sessionId
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted text-foreground"
                )}
              >
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className="flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    <span className="truncate font-medium">{s.title}</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground pl-5">
                    {formatDate(s.updatedAt)}
                  </span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setRenameId(s.id); setRenameTitle(s.title); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:text-primary shrink-0"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmId(s.id); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:text-destructive shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New Chat</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Chat name..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewChatOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!title.trim() || creating}>
              {creating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating...</> : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!renameId} onOpenChange={(o) => !renaming && !o && setRenameId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename Session</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="New name..."
            value={renameTitle}
            onChange={(e) => setRenameTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameId(null)} disabled={renaming}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!renameTitle.trim() || renaming}>
              {renaming ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Renaming...</> : "Rename"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmId} onOpenChange={(o) => !deleting && !o && setConfirmId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {confirmSession?.title}
              </span>
              ? This will permanently remove all messages in this session.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmId(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SessionsSidebar;
