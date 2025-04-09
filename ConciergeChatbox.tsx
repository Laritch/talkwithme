import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Send,
  Mic,
  RefreshCw,
  Bot,
  Sparkles,
  User,
} from "lucide-react";

interface Message {
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

const ConciergeChatbox = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content: "Hi there! I'm your personal AI concierge. How can I help you today? You can ask me about recommendations for experts, resources for specific challenges, or guidance on your wellbeing journey.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      // Mock AI responses based on user input
      let aiResponse = "";

      if (input.toLowerCase().includes("stress") || input.toLowerCase().includes("anxiety")) {
        aiResponse = "Based on your concern about stress, I'd recommend connecting with Dr. Sarah Johnson, who specializes in stress management. She offers a variety of techniques that have helped many clients. Would you like me to suggest some resources or schedule a consultation with her?";
      } else if (input.toLowerCase().includes("career") || input.toLowerCase().includes("job")) {
        aiResponse = "For career guidance, Michael Chen would be an excellent match. He has 12+ years of experience helping professionals navigate career transitions and advancement. His Career Accelerator mastermind group also has 2 open spots if you're interested in group coaching.";
      } else if (input.toLowerCase().includes("money") || input.toLowerCase().includes("finance")) {
        aiResponse = "I see you're interested in financial wellness. Lisa Patel is our top financial advisor who could help you create a personalized plan. She also has helpful resources on budgeting and debt management that I can share with you.";
      } else {
        aiResponse = "Thanks for sharing. Based on what you've told me, I can help connect you with relevant experts or resources. Could you tell me a bit more about what specific areas you're looking for help with?";
      }

      const aiMessage: Message = {
        role: "ai",
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-[600px] flex flex-col">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4">
        <div className="flex items-center">
          <div className="bg-white/20 p-2 rounded-full mr-3">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">AI Concierge</h3>
            <p className="text-xs text-blue-100">
              Personalized guidance at your service
            </p>
          </div>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-4" id="chat-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === "user"
                  ? "bg-blue-600 text-white rounded-tr-none"
                  : "bg-gray-100 text-gray-800 rounded-tl-none"
              }`}
            >
              <div className="flex items-center mb-1">
                {message.role === "ai" ? (
                  <Sparkles className="h-4 w-4 mr-1 text-blue-600" />
                ) : (
                  <User className="h-4 w-4 mr-1 text-white" />
                )}
                <span className={`text-xs ${message.role === "user" ? "text-blue-100" : "text-gray-500"}`}>
                  {message.role === "ai" ? "AI Concierge" : "You"}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <div className="text-right">
                <span className={`text-xs ${message.role === "user" ? "text-blue-100" : "text-gray-500"}`}>
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg rounded-tl-none p-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 p-3">
        <div className="flex items-center">
          <div className="flex-grow">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
              rows={2}
            ></textarea>
          </div>
          <div className="pl-3 flex space-x-2">
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full bg-gray-100 hover:bg-gray-200"
            >
              <Mic className="h-5 w-5 text-gray-600" />
            </Button>
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={!input.trim()}
              className="rounded-full"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
          <div className="flex items-center">
            <RefreshCw className="h-3 w-3 mr-1" />
            <span>New conversation</span>
          </div>
          <div>
            Powered by Stressedabit AI
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConciergeChatbox;
