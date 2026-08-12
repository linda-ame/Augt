function aiApiKey() {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) throw new Error("Trūkst AI_API_KEY.");
  return apiKey;
}

/** Kore = warm narrator voice (Latvian via Gemini TTS). */
export const GOSPEL_TTS_VOICE = "Kore";
export const GOSPEL_TTS_MODEL = "gemini-2.5-flash-preview-tts";

function pcmToWav(pcm: Buffer, sampleRate = 24_000): Buffer {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

function parseSampleRate(mimeType: string | undefined): number {
  const m = mimeType?.match(/rate=(\d+)/i);
  return m ? Number(m[1]) : 24_000;
}

/** Synthesize spoken Latvian text → WAV buffer (Gemini Flash TTS). */
export async function synthesizeSpeechWav(
  spokenText: string,
  options?: { voice?: string; model?: string },
): Promise<Buffer> {
  const text = spokenText.trim();
  if (!text) throw new Error("Tukšs TTS teksts.");

  const model = options?.model ?? GOSPEL_TTS_MODEL;
  const voice = options?.voice ?? GOSPEL_TTS_VOICE;
  const key = aiApiKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const prompt = `Read aloud in Latvian, warm and calm, like a kind storyteller speaking to children. Speak naturally with short pauses between sections. Do not add extra words.\n\n${text}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    }),
  });

  const json = (await res.json()) as {
    error?: { message?: string };
    candidates?: Array<{
      content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> };
    }>;
  };

  if (!res.ok || json.error) {
    throw new Error(json.error?.message || `TTS kļūda (${res.status})`);
  }

  const inline = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)
    ?.inlineData;
  if (!inline?.data) {
    throw new Error("TTS neatgrieza audio.");
  }

  const pcm = Buffer.from(inline.data, "base64");
  return pcmToWav(pcm, parseSampleRate(inline.mimeType));
}
