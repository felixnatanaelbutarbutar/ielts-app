import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import pool from '../../../lib/db';

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { part, questionId, topic, customPrompt } = body;

  try {
    const client = await pool.connect();
    const result = await client.query(
      `INSERT INTO sessions (id, user_id, part, question_id, custom_prompt, started_at)
       VALUES (uuid_generate_v4(), (SELECT id FROM users WHERE email = $1), $2, $3, $4, CURRENT_TIMESTAMP)
       RETURNING id`,
      [session.user.email, part, questionId, customPrompt || topic]
    );
    client.release();
    return NextResponse.json({ sessionId: result.rows[0].id });
  } catch (error) {
    console.error('Error starting session:', error);
    return NextResponse.json({ error: 'Failed to start session' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { sessionId, finishedAt } = body;

  try {
    const client = await pool.connect();
    await client.query(
      `UPDATE sessions SET finished_at = $1 WHERE id = $2 AND user_id = (SELECT id FROM users WHERE email = $3)`,
      [finishedAt, sessionId, session.user.email]
    );
    client.release();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error finishing session:', error);
    return NextResponse.json({ error: 'Failed to finish session' }, { status: 500 });
  }
}