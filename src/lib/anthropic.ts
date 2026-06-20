import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { RawWordGenSchema, buildWordPrompt, type GenerateWord } from "./word-gen.js";

export const MODEL = process.env.LID_MODEL ?? "claude-opus-4-8";

export function makeClient(): Anthropic {
  return new Anthropic();
}

export function createWordGenerator(client: Anthropic): GenerateWord {
  return async (occ) => {
    const res = await client.beta.messages.parse({
      model: MODEL,
      // Gives adaptive thinking headroom; 1024 minimum leaves no room for output.
      max_tokens: 16000,
      // "adaptive" is the correct wire value for Opus 4.8 but is not in @anthropic-ai/sdk 0.69.0's types yet;
      // do NOT "fix" this to {type:"enabled"} (that would 400 on 4.8).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      thinking: { type: "adaptive" } as any,
      messages: [{ role: "user", content: buildWordPrompt(occ) }],
      output_format: betaZodOutputFormat(RawWordGenSchema),
    });
    if (!res.parsed_output) {
      throw new Error(`No parsed output for word "${occ.surface}"`);
    }
    return res.parsed_output;
  };
}

export async function generateExplanation(
  client: Anthropic,
  prompt: string,
): Promise<string> {
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    // "adaptive" is the correct wire value for Opus 4.8 but is not in @anthropic-ai/sdk 0.69.0's types yet;
    // do NOT "fix" this to {type:"enabled"} (that would 400 on 4.8).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    thinking: { type: "adaptive" } as any,
    messages: [{ role: "user", content: prompt }],
  });
  const text = res.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") {
    throw new Error("No text block in explanation response");
  }
  return text.text;
}
