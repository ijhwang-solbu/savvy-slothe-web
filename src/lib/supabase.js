'use client';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://igdpvanunwvpzkukwymr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI...';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
