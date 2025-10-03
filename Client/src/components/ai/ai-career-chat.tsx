"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog"
import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"
import { MessageCircle, Send, Loader2 } from "lucide-react"
import { getEmployeeResumeData, getEmployeeResumeParsedData } from "../../utils/api"

// Lazy import Google Generative AI to avoid bundle bloat until needed
type GoogleGenerativeAIType = any

const GEMINI_KEY = import.meta.env.VITE_GEMINIAI_API_KEY

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
}

interface AICareerChatProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AICareerChat({ open, onOpenChange }: AICareerChatProps) {
  const [loadingResume, setLoadingResume] = useState(false)
  const [initializingAI, setInitializingAI] = useState(false)
  const [resumeContext, setResumeContext] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const chatRef = useRef<any | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Reset modal state when closed
  useEffect(() => {
    if (!open) {
      setLoadingResume(false)
      setInitializingAI(false)
      setResumeContext(null)
      setMessages([])
      setInput("")
      chatRef.current = null
    }
  }, [open])

  // On open: fetch resume data one time
  useEffect(() => {
    const fetchResume = async () => {
      if (!open || resumeContext || loadingResume) return

      console.log("[v0][chat] init start", {
        open,
        hasResumeContext: !!resumeContext,
        loadingResume,
        initializingAI,
      })

      const credsRaw = localStorage.getItem("authCredentials")
      console.log("[v0][chat] localStorage.authCredentials exists:", !!credsRaw)

      if (!credsRaw) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "I couldn't find your credentials. Please login again.",
          },
        ])
        return
      }

      const parsedCreds = JSON.parse(credsRaw || "{}") as { email?: string; password?: string }
      const { email, password } = parsedCreds
      console.log("[v0][chat] creds parsed", {
        emailPresent: !!email,
        passwordPresent: !!password,
        passwordLen: typeof password === "string" ? password.length : 0,
      })

      if (!email || !password) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Your credentials are incomplete. Please login again.",
          },
        ])
        return
      }

      try {
        setLoadingResume(true)

        const resp = await getEmployeeResumeData({ email, password })
        console.log("[v0][chat] getEmployeeResumeData raw response:", resp)

        let dataForContext: any = resp
        if (resp?.resume_data) dataForContext = resp.resume_data
        if (resp?.data) dataForContext = resp.data
        if (resp?.text || resp?.pastedText) dataForContext = resp.text || resp.pastedText

        let contextString =
          typeof dataForContext === "string" ? dataForContext : JSON.stringify(dataForContext, null, 2)

        console.log("[v0][chat] primary context computed", {
          type: typeof dataForContext,
          isString: typeof dataForContext === "string",
          stringLength: typeof contextString === "string" ? contextString.length : 0,
        })

        const looksEmpty =
          !contextString ||
          contextString === "null" ||
          contextString === "undefined" ||
          contextString.trim() === "" ||
          contextString.trim() === "{}" ||
          contextString.trim() === "[]"

        if (looksEmpty) {
          console.warn("[v0][chat] context looks empty; attempting parsed-data fallback")
          try {
            const parsedResp = await getEmployeeResumeParsedData({ email, password })
            console.log("[v0][chat] parsed-data response:", parsedResp)

            let parsedForContext: any = parsedResp
            if (parsedResp?.resume_data) parsedForContext = parsedResp.resume_data
            if (parsedResp?.data) parsedForContext = parsedResp.data
            if (parsedResp?.text || parsedResp?.pastedText) parsedForContext = parsedResp.text || parsedResp.pastedText

            const parsedContext =
              typeof parsedForContext === "string" ? parsedForContext : JSON.stringify(parsedForContext, null, 2)

            const parsedLooksEmpty =
              !parsedContext ||
              parsedContext === "null" ||
              parsedContext === "undefined" ||
              parsedContext.trim() === "" ||
              parsedContext.trim() === "{}" ||
              parsedContext.trim() === "[]"

            console.log("[v0][chat] parsed context stats", {
              stringLength: typeof parsedContext === "string" ? parsedContext.length : 0,
              parsedLooksEmpty,
            })

            if (!parsedLooksEmpty) {
              contextString = parsedContext
            }
          } catch (fallbackErr) {
            console.error("[v0][chat] parsed-data fallback failed:", fallbackErr)
          }
        }

        if (!contextString || contextString.trim() === "" || contextString.trim() === "{}") {
          console.warn("[v0][chat] final context is empty after fallback")
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: "I couldn't find any resume data for your account yet. Please upload your resume and try again.",
            },
          ])
          return
        }

        // Important: set the state and let the next effect initialize AI
        setResumeContext(contextString)
        console.log("[v0][chat] resumeContext set in state; length:", contextString.length)
      } catch (e) {
        console.error("[v0] Failed to fetch resume data for AI Chat:", e)
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "I couldn't fetch your resume data at the moment. Please try again later.",
          },
        ])
      } finally {
        setLoadingResume(false)
      }
    }

    void fetchResume()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, resumeContext, loadingResume])

  // After resumeContext is available, initialize the AI chat session once
  useEffect(() => {
    const initAI = async () => {
      if (!open || !resumeContext || initializingAI || chatRef.current) return

      try {
        setInitializingAI(true)
        console.log("[v0][chat] initializing AI session; context length:", resumeContext.length)

        if (!GEMINI_KEY) {
          throw new Error("Missing VITE_GEMINIAI_API_KEY environment variable. Please set it to enable AI chat.")
        }

        const { GoogleGenerativeAI } = (await import("@google/generative-ai")) as {
          GoogleGenerativeAI: new (key: string) => GoogleGenerativeAIType
        }

        const genAI = new GoogleGenerativeAI(GEMINI_KEY)
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
        console.log("[v0][chat] model ready")

        const chat = model.startChat({
          generationConfig: {
            temperature: 0.3,
          },
        })
        chatRef.current = chat

        const systemInit = `
You are an AI Career Assistant. Thoroughly understand the user's resume data below and use it as primary context for follow-up questions.

Rules:
- If a user question is completely irrelevant to career/tech/corporate or to the provided data, respond exactly: "Please ask a relevant question."
- If the question is relevant but the resume doesn't contain the needed details, answer using your own general tech/corporate knowledge and clearly note that it's a generalized answer due to missing resume details.
- Be concise, clear, and helpful, maintaining a professional tone consistent with a modern HR/career platform.

User Resume Data (JSON or text):
${resumeContext}

Respond with a short acknowledgment that you have understood the resume and are ready to help.
      `.trim()

        const initResp = await chat.sendMessage(systemInit)
        const initText = await initResp.response.text()
        console.log("[v0][chat] init response received; length:", initText?.length || 0)

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: initText || "Got it. I'm ready to help.",
          },
        ])
      } catch (e) {
        console.error("[v0] AI initialization failed:", e)
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "AI is currently unavailable. Please ensure your API key is configured and try again.",
          },
        ])
      } finally {
        setInitializingAI(false)
      }
    }

    void initAI()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, resumeContext, initializingAI])

  const sendingDisabled = useMemo(
    () => !chatRef.current || initializingAI || loadingResume || !resumeContext,
    [initializingAI, loadingResume, resumeContext],
  )

  const handleSend = async () => {
    const trimmed = input.trim()
    console.log("[v0][chat] handleSend called", {
      trimmedLen: trimmed.length,
      sendingDisabled,
      hasChat: !!chatRef.current,
      hasContext: !!resumeContext,
    })
    if (!trimmed || sendingDisabled) return
    setInput("")

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    }
    setMessages((prev) => [...prev, userMsg])

    try {
      const chat = chatRef.current
      const guardrails = `
Follow the earlier rules:
- If irrelevant, reply: "Please ask a relevant question."
- If relevant but resume lacks details, use general knowledge and note it's generalized.
User: ${trimmed}
      `.trim()

      const resp = await chat.sendMessage(guardrails)
      const text = await resp.response.text()
      console.log("[v0][chat] assistant reply length:", text?.length || 0)

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: text || "I couldn't generate a response. Please try again.",
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (e) {
      console.error("[v0] Failed to send message:", e)
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "I ran into an issue responding. Please try again.",
      }
      setMessages((prev) => [...prev, assistantMsg])
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl glass-card border-glass-border/50 p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b border-glass-border/40 bg-background/60 backdrop-blur">
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-neon-teal" />
            AI Career Chat
          </DialogTitle>
          <DialogDescription className="sr-only">
            Ask career questions based on your uploaded resume context.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          {/* Loader overlay during resume fetch or AI init */}
          {(loadingResume || initializingAI) && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80">
              <div className="glass-card p-4 rounded-xl flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-neon-teal" />
                <span className="text-sm">
                  {loadingResume ? "Fetching your resume data..." : "Initializing AI session..."}
                </span>
              </div>
            </div>
          )}

          {/* Messages */}
          <div ref={scrollRef} className="h-[420px] overflow-y-auto p-4 space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] px-3 py-2 rounded-lg border ${
                  m.role === "user"
                    ? "ml-auto bg-gradient-to-br from-neon-teal/15 to-neon-teal/5 border-neon-teal/30"
                    : "mr-auto glass-card border-glass-border/50"
                }`}
              >
                <div className="text-xs mb-1 opacity-70">{m.role === "user" ? "You" : "Assistant"}</div>
                <div className="text-sm whitespace-pre-wrap">{m.content}</div>
              </div>
            ))}

            {!messages.length && (
              <div className="h-full w-full flex items-center justify-center text-foreground-secondary">
                Start a conversation once the assistant is ready.
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-glass-border/40 bg-background/60 backdrop-blur">
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your resume, skills, roles, or career path..."
                className="min-h-[48px] max-h-[120px] resize-y bg-background/80"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    void handleSend()
                  }
                }}
                disabled={sendingDisabled}
              />
              <Button
                className="btn-gradient-primary"
                onClick={handleSend}
                disabled={sendingDisabled || input.trim().length === 0}
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-[10px] text-foreground-secondary mt-1">
              The session resets when you close this chat.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
