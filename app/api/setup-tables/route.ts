import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use Service Role Key for high-privilege operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(request: NextRequest) {
    try {
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is required' }, { status: 500 });
        }

        const sql = `
            -- Enable UUID extension if not already enabled
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

            -- Create products table
            CREATE TABLE IF NOT EXISTS public.products (
                id uuid NOT NULL DEFAULT uuid_generate_v4(),
                item_name_eng text NOT NULL,
                item_name_hi text NULL,
                item_name_od text NULL,
                created_at timestamp with time zone NULL DEFAULT now(),
                updated_at timestamp with time zone NULL DEFAULT now(),
                CONSTRAINT products_pkey PRIMARY KEY (id),
                CONSTRAINT products_name_eng_key UNIQUE (item_name_eng)
            ) TABLESPACE pg_default;

            CREATE INDEX IF NOT EXISTS idx_products_name_eng ON public.products USING btree (item_name_eng) TABLESPACE pg_default;

            -- Create parties table
            CREATE TABLE IF NOT EXISTS public.parties (
                id uuid NOT NULL DEFAULT uuid_generate_v4(),
                name_eng text NOT NULL,
                name_hi text NULL,
                name_od text NULL,
                created_at timestamp with time zone NULL DEFAULT now(),
                updated_at timestamp with time zone NULL DEFAULT now(),
                CONSTRAINT parties_pkey PRIMARY KEY (id),
                CONSTRAINT parties_name_eng_key UNIQUE (name_eng)
            ) TABLESPACE pg_default;

            CREATE INDEX IF NOT EXISTS idx_parties_name_eng ON public.parties USING btree (name_eng) TABLESPACE pg_default;
        `;

        // We use the supabase.rpc helper to execute raw SQL if a function is set up, 
        // OR we inform the user to run this in the Supabase Dashboard.
        // Direct SQL execution via JS client is limited for security.
        
        return NextResponse.json({
            message: 'SQL Generated. Please run this in your Supabase SQL Editor for best results.',
            sql: sql,
            instructions: 'Go to Supabase Dashboard -> SQL Editor -> New Query -> Paste the SQL and Run.'
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
