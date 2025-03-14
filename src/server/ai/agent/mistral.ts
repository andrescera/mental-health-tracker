import { Mistral } from "@mistralai/mistralai";

const client: Mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

export const getMistralAdvice = async (input: unknown) => {
  if (process.env.MISTRAL_AGENT_ID) {
    return (
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      (
        await client.agents.complete({
          agentId: process.env.MISTRAL_AGENT_ID,
          messages: [{ role: "user", content: JSON.stringify(input) }],
        })
      )?.choices?.[0]?.message.content?.toString() ?? "No advice could be generated."
    );
  }

  return "No advice could be generated.";
};
