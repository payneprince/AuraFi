"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "./ui/button";

export function LiveChat() {
  return (
    <Button
      size="icon"
      className="fixed bottom-6 left-6 z-50 h-14 w-14 rounded-full bg-accent hover:bg-accent/90 shadow-lg"
      onClick={() => alert("Chat feature coming soon!")}
    >
      <MessageCircle className="h-6 w-6" />
    </Button>
  );
}
