import { createServerFn } from "@tanstack/react-start";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `You are the Smart Dispensary AI Health Assistant for Thapar Institute campus.

Your job:
1. Ask brief clarifying questions when symptoms are vague (duration, severity, fever, existing conditions, allergies).
2. Suggest common over-the-counter medicines available at the campus dispensary (e.g. Paracetamol 500mg, ORS, Cetirizine, Pantoprazole, Antacid, Betadine, Cough syrup, Ibuprofen), with typical adult dosage, timing and cautions. Always note that OTC advice assumes no allergies, pregnancy or chronic illness.
3. Clearly state WHEN THE STUDENT SHOULD SEE A DOCTOR. Give explicit thresholds (e.g. fever above 102F or lasting more than 3 days, breathlessness, chest pain, blood in stool/urine/vomit, severe dehydration, injury with deep wound, symptoms not improving in 48-72 hours).
4. Escalate immediately to emergency for red flags: chest pain, difficulty breathing, unconsciousness, seizure, severe bleeding, suicidal thoughts, severe allergic reaction. Tell them to use the Emergency SOS page or call campus ambulance 24x7 at 0175-2393333.

Style: short, warm, practical. Use markdown-free plain text with short bullet lines starting with "- ". Always end with a one-line triage verdict in this exact shape:
VERDICT: <Self-care at dispensary | Book a doctor appointment | Go to emergency now>

You are not a doctor and cannot diagnose; say so briefly once, not repeatedly.`;

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((input: { messages: ChatMessage[] }) => input)
  .handler(async ({ data }) => {
    // tolerate quotes / stray whitespace / Windows line endings around the key in .env
    const apiKey = process.env["GEMINI_API_KEY"]?.trim().replace(/^["']|["']$/g, "");
    if (!apiKey) throw new Error("Assistant is not set up. Add GEMINI_API_KEY to .env");

    // gemini's openai-compatible endpoint
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemini-2.5-flash",
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...data.messages.slice(-20)],
        }),
      },
    );

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429)
        throw new Error("Too many requests, try again in a minute.");
      if (res.status === 400 || res.status === 401 || res.status === 403)
        throw new Error(`Gemini rejected the API key (${res.status}). Check GEMINI_API_KEY in .env.`);
      throw new Error(`Assistant failed (${res.status}): ${body.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = json.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error("The assistant returned an empty response.");
    return { reply };
  });
