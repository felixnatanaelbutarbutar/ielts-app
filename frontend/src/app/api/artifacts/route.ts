import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import pool from '../../../lib/db';

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { sessionId, audioUrl, transcript, fluencyJson, grammarOutput, coherenceJson, vocabJson, bandScoresJson } = body;

  try {
    const client = await pool.connect();
    await client.query(
      `INSERT INTO artifacts (id, session_id, audio_url, transcript, fluency_json, grammar_output, coherence_json, vocab_json, band_scores_json, created_at)
       VALUES (uuid_generate_v4(), $1, $2, $3, $4::jsonb, $5, $6::jsonb, $7::jsonb, $8::jsonb, CURRENT_TIMESTAMP)`,
      [sessionId, audioUrl, transcript, fluencyJson, grammarOutput, coherenceJson, vocabJson, bandScoresJson]
    );
    client.release();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving artifact:', error);
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
  }
}