import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ModelCommand {
  name: string;
  args: Record<string, unknown>;
}

export interface ModelState {
  color: string;
  wireframe: boolean;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  scale: number;
}

const COOLDOWN_MS = 12000;

export function useVoiceAssistant(
  modelState: ModelState,
  onCommands: (cmds: ModelCommand[]) => void
) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [cooldown, setCooldown] = useState(0); // 0-1 progress
  const [lastResponse, setLastResponse] = useState('');
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const cooldownStart = useRef(0);
  const recognitionRef = useRef<any>(null);

  // Cleanup
  useEffect(() => {
    return () => {
      if (cooldownTimer.current) clearInterval(cooldownTimer.current);
      window.speechSynthesis.cancel();
    };
  }, []);

  const startCooldown = useCallback(() => {
    cooldownStart.current = Date.now();
    setCooldown(0.001);
    cooldownTimer.current = setInterval(() => {
      const elapsed = Date.now() - cooldownStart.current;
      const progress = Math.min(elapsed / COOLDOWN_MS, 1);
      setCooldown(progress);
      if (progress >= 1) {
        if (cooldownTimer.current) clearInterval(cooldownTimer.current);
        cooldownTimer.current = null;
        setCooldown(0);
      }
    }, 100);
  }, []);

  const speak = useCallback((text: string) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 1.2;
    setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  const sendToAstra = useCallback(
    async (transcript: string) => {
      try {
        const { data, error } = await supabase.functions.invoke('astra-chat', {
          body: { transcript, modelState },
        });

        if (error) {
          console.error('Astra error:', error);
          toast.error('Astra could not respond');
          return;
        }

        const { text, commands } = data as { text: string; commands: ModelCommand[] };

        if (text) {
          setLastResponse(text);
          speak(text);
        }

        if (commands && commands.length > 0) {
          onCommands(commands);
          if (!text) {
            const cmdNames = commands.map((c) => c.name).join(', ');
            setLastResponse(`Executing: ${cmdNames}`);
            speak(`Done`);
          }
        }
      } catch (err) {
        console.error('sendToAstra error:', err);
        toast.error('Failed to reach Astra');
      }
    },
    [modelState, onCommands, speak]
  );

  const toggleListening = useCallback(() => {
    if (cooldown > 0 && cooldown < 1) {
      toast.info('Please wait for cooldown');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      startCooldown();
      sendToAstra(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech error:', event.error);
      setIsListening(false);
      if (event.error !== 'no-speech') {
        toast.error(`Mic error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    setIsListening(true);
  }, [cooldown, isListening, startCooldown, sendToAstra]);

  return {
    isListening,
    isSpeaking,
    cooldown,
    lastResponse,
    toggleListening,
  };
}
