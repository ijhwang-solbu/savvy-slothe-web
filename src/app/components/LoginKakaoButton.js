'use client'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function LoginKakaoButton() {
  const handleKakaoLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
    })
  }

  return (
    <button
      onClick={handleKakaoLogin}
      className="w-full max-w-xs bg-yellow-300 text-black py-2 px-4 rounded-md shadow-sm hover:bg-yellow-400 transition cursor-pointer mt-[5px]"
    >
      카카오로 시작하기
    </button>
  )
}
