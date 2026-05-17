import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Protected Area</h1>
      <p className="text-muted-foreground">
        Logged in as: {user.email}
      </p>
    </div>
  )
}