import { buildRootLlmsTxt, llmsResponse } from "@/lib/llms";

export const revalidate = 3600;

/** /llms.txt: bilingual overview for AI assistants (https://llmstxt.org). */
export async function GET() {
  return llmsResponse(await buildRootLlmsTxt());
}
