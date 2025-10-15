import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import pool from '../../../lib/db';

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { sessionId, topic, scoreGrammar, scoreVocab, scoreFluency, scoreCoherence, overallScore } = body;

  try {
    const client = await pool.connect();
    await client.query(
      `INSERT INTO history (user_email, session_id, topic, score_grammar, score_vocab, score_fluency, score_coherence, overall_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [session.user.email, sessionId, topic, scoreGrammar, scoreVocab, scoreFluency, scoreCoherence, overallScore]
    );
    client.release();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving history:', error);
    return NextResponse.json({ error: 'Failed to save history' }, { status: 500 });
  }
}