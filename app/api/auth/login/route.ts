import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { gmail, password } = await req.json();

    if (!gmail || !password) {
      return NextResponse.json({ success: false, error: 'Gmail and Password are required' }, { status: 400 });
    }

    // Check credentials against the label_users table (supports both gmail and phone number)
    const { data: user, error } = await supabase
      .from('label_users')
      .select('id, name, gmail, role, number')
      .or(`gmail.eq."${gmail}",number.eq."${gmail}"`)
      .eq('password', password)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Invalid gmail or password' }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        name: user.name,
        gmail: user.gmail,
        role: user.role
      }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ success: false, error: 'Authentication service unavailable' }, { status: 500 });
  }
}
