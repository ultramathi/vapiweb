"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { ModeToggle } from "@/components/theme-toggle"
import { ExternalLink, Mic, MicOff, Pizza, Phone, PhoneOff } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function PizzaAssistant() {
  const [vapi, setVapi] = useState(null)
  const [status, setStatus] = useState("Ready")
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [volumeLevel, setVolumeLevel] = useState(0)
  const [errorMessage, setErrorMessage] = useState("")
  const [isApiKeyValid, setIsApiKeyValid] = useState(true)

  // Initialize Vapi on client-side only
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("@vapi-ai/web").then((module) => {
        const Vapi = module.default

        // Get API key from environment variables - only check once
        const apiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY || ""

        if (!apiKey) {
          setErrorMessage("API key is missing. Please check your environment variables.")
          setStatus("Error")
          setIsApiKeyValid(false)
          return
        }

        // Initialize Vapi
        const vapiInstance = new Vapi(apiKey)
        setVapi(vapiInstance)
        setIsApiKeyValid(true)

        // Set up event listeners
        vapiInstance.on("call-start", () => {
          setIsConnecting(false)
          setIsConnected(true)
          setErrorMessage("")
          setStatus("Connected")
        })

        vapiInstance.on("call-end", () => {
          setIsConnecting(false)
          setIsConnected(false)
          setStatus("Call ended")
        })

        vapiInstance.on("speech-start", () => {
          setIsSpeaking(true)
        })

        vapiInstance.on("speech-end", () => {
          setIsSpeaking(false)
        })

        vapiInstance.on("volume-level", (level) => {
          setVolumeLevel(level)
        })

        vapiInstance.on("error", (error) => {
          console.error("Vapi error:", error)
          setIsConnecting(false)

          // Handle different types of errors
          if (error?.error?.message?.includes("card details")) {
            setErrorMessage("Payment required. Visit the Vapi dashboard to set up your payment method.")
          } else if (error?.error?.statusCode === 401 || error?.error?.statusCode === 403) {
            // API key is invalid - update state
            setErrorMessage("API key is invalid. Please check your environment variables.")
            setIsApiKeyValid(false)
          } else {
            setErrorMessage(error?.error?.message || "An error occurred")
          }

          setStatus("Error")
        })
      })
    }

    // Cleanup function
    return () => {
      if (vapi) {
        vapi.stop()
      }
    }
  }, [])

  // Start call function - no need to recheck API key
  const startCall = () => {
    if (!isApiKeyValid) {
      setErrorMessage("Cannot start call: API key is invalid or missing.")
      return
    }

    setIsConnecting(true)
    setStatus("Connecting...")
    setErrorMessage("")

    vapi.start(assistantOptions)
  }

  // End call function
  const endCall = () => {
    if (vapi) {
      vapi.stop()
    }
  }

  // Get status badge color
  const getStatusColor = () => {
    if (status === "Connected") return "success"
    if (status === "Error") return "destructive"
    if (status === "Connecting...") return "warning"
    return "secondary"
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8">
      <div className="absolute top-4 right-4 flex gap-2">
        <ModeToggle />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" asChild>
                <a href="https://docs.vapi.ai" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Return to docs</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Card className="w-full max-w-md shadow-lg border-2">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="bg-primary/10 p-3 rounded-full">
              <Pizza className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Pizza Voice Assistant</CardTitle>
          <CardDescription>Order your favorite pizza with voice commands</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            <Badge variant={getStatusColor()}>{status}</Badge>
          </div>

          {isConnected && (
            <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                {isSpeaking ? (
                  <Mic className="h-4 w-4 text-green-500 animate-pulse" />
                ) : (
                  <MicOff className="h-4 w-4 text-muted-foreground" />
                )}
                <p className="text-sm">{isSpeaking ? "Assistant is speaking" : "Assistant is listening"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Volume Level</p>
                <Progress value={volumeLevel * 100} className="h-2" />
              </div>
            </div>
          )}

          {errorMessage && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {errorMessage}
                {errorMessage.includes("payment") && (
                  <Button variant="link" className="p-0 h-auto" asChild>
                    <a
                      href="https://dashboard.vapi.ai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 mt-2"
                    >
                      Go to Vapi Dashboard <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter>
          <Button 
            className="w-full"
            size="lg"
            variant={isConnected ? "destructive" : "default"}
            onClick={isConnected ? endCall : startCall}
            disabled={isConnecting || !isApiKeyValid}
          >
            {isConnected ? (
              <PhoneOff className="mr-2 h-4 w-4" />
            ) : (
              <Phone className="mr-2 h-4 w-4" />
            )}
            {isConnecting ? "Connecting..." : isConnected ? "End Call" : "Call Pizza Shop"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

// Pizza assistant configuration
const assistantOptions = {
  name: "Pizza Assistant",
  firstMessage: "Vappy's Pizzeria speaking, how can I help you?",
  transcriber: {
    provider: "deepgram",
    model: "nova-2",
    language: "en-US",
  },
  voice: {
    provider: "playht",
    voiceId: "jennifer",
  },
  model: {
    provider: "openai",
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are a voice assistant for Vappy's Pizzeria, a pizza shop located on the Internet.

Your job is to take the order of customers calling in. The menu has only 3 types
of items: pizza, sides, and drinks. There are no other types of items on the menu.

1) There are 3 kinds of pizza: cheese pizza, pepperoni pizza, and vegetarian pizza
(often called "veggie" pizza).
2) There are 3 kinds of sides: french fries, garlic bread, and chicken wings.
3) There are 2 kinds of drinks: soda, and water. (if a customer asks for a
brand name like "coca cola", just let them know that we only offer "soda")

Customers can only order 1 of each item. If a customer tries to order more
than 1 item within each category, politely inform them that only 1 item per
category may be ordered.

Customers must order 1 item from at least 1 category to have a complete order.
They can order just a pizza, or just a side, or just a drink.

Be sure to introduce the menu items, don't assume that the caller knows what
is on the menu (most appropriate at the start of the conversation).

If the customer goes off-topic or off-track and talks about anything but the
process of ordering, politely steer the conversation back to collecting their order.

Once you have all the information you need pertaining to their order, you can
end the conversation. You can say something like "Awesome, we'll have that ready
for you in 10-20 minutes." to naturally let the customer know the order has been
fully communicated.

It is important that you collect the order in an efficient manner (succinct replies
& direct questions). You only have 1 task here, and it is to collect the customers
order, then end the conversation.

- Be sure to be kind of funny and witty!
- Keep all your responses short and simple. Use casual language, phrases like "Umm...", "Well...", and "I mean" are preferred.
- This is a voice conversation, so keep your responses short, like in a real conversation. Don't ramble for too long.`,
      },
    ],
  },
}
