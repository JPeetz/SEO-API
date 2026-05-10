import { NextRequest, NextResponse } from 'next/server';
import { buildEvaluationPrompt, analyzeEntityDensity, analyzeAnswerStructure, analyzeQuotability, analyzeEEAT } from '@/lib/geo-utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, targetQuery, includeSignals = true } = body;

    if (!content || typeof content !== 'string')
      return NextResponse.json({ error: '`content` (string) is required' }, { status: 400 });
    if (!targetQuery || typeof targetQuery !== 'string')
      return NextResponse.json({ error: '`targetQuery` (string) is required' }, { status: 400 });

    // Optionally pre-compute algorithmic signals and embed them in the prompt
    // so the calling agent's LLM gets richer context without extra API calls
    const priorSignals = includeSignals ? {
      entityDensity:   analyzeEntityDensity(content),
      answerStructure: analyzeAnswerStructure(content),
      quotability:     analyzeQuotability(content),
      eeat:            analyzeEEAT(content),
    } : undefined;

    const result = buildEvaluationPrompt(content, targetQuery, priorSignals);

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        // Convenience: pre-computed signals also returned separately
        // so agent can log/store them without re-parsing the prompt
        algorithmicSignals: priorSignals ?? null,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
}
export async function OPTIONS() { return new NextResponse(null, { status: 204 }); }
