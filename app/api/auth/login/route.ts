import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { gmail, password } = await req.json();

    if (!gmail || !password) {
      return NextResponse.json({ success: false, error: 'Gmail and Password are required' }, { status: 400 });
    }

    // Check credentials against the users table
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, gmail, role')
      .eq('gmail', gmail)
      .eq('password', password)
      .single();

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
