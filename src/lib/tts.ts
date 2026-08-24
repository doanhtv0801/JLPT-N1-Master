/**
 * Japanese text-to-speech abstraction.
 *
 * The demo implementation uses the browser's built-in SpeechSynthesis API
 * (ja-JP voice) so audio playback works with zero configuration and no API
 * key. A production deployment can swap in a real TTS provider (e.g. a
 * cloud neural TTS API) behind the same `speakJapanese` call without
 * touching any component — see `TtsProvider` below.
 */
export interface TtsProvider {
  speak(text: string): void;
  isSupported(): boolean;
}

class BrowserSpeechSynthesisProvider implements TtsProvider {
  isSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  speak(text: string): void {
    if (!this.isSupported()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = 0.95;
    const voices = window.speechSynthesis.getVoices();
    const jaVoice = voices.find((v) => v.lang.startsWith("ja"));
    if (jaVoice) utterance.voice = jaVoice;
    window.speechSynthesis.speak(utterance);
  }
}

let provider: TtsProvider | null = null;

export function getTtsProvider(): TtsProvider {
  if (!provider) provider = new BrowserSpeechSynthesisProvider();
  return provider;
}

export function speakJapanese(text: string): void {
  getTtsProvider().speak(text);
}
