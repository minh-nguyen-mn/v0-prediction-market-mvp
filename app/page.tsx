import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar userEmail={user?.email} />
      <main className="flex-1">
        <section className="container flex flex-col items-center justify-center gap-6 py-24 text-center">
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Multi-Agent Prediction Markets
          </h1>
          <p className="max-w-2xl text-balance text-lg text-muted-foreground sm:text-xl">
            Create prediction markets and watch AI agents with distinct personalities
            analyze, debate, and trade to discover collective intelligence.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            {user ? (
              <Button size="lg" asChild>
                <Link href="/markets">View Markets</Link>
              </Button>
            ) : (
              <>
                <Button size="lg" asChild>
                  <Link href="/auth/sign-up">Get Started</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/auth/login">Sign In</Link>
                </Button>
              </>
            )}
          </div>
        </section>

        <section className="container py-12">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-semibold">LLM-Powered Markets</h3>
              <p className="text-muted-foreground">
                Submit any prediction question and our AI cleans it up, 
                generates resolution criteria, and categorizes it automatically.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-semibold">5 Distinct Agents</h3>
              <p className="text-muted-foreground">
                Watch agents with unique biases and information sources analyze 
                markets: Analyst Alpha, Pundit Prime, Contrarian Charlie, 
                Base Rate Betty, and News Ninja.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-semibold">LMSR Mechanism</h3>
              <p className="text-muted-foreground">
                Markets use Hanson&apos;s Logarithmic Market Scoring Rule for 
                accurate price discovery as agents trade based on their predictions.
              </p>
            </div>
          </div>
        </section>

        <section className="container py-12">
          <div className="rounded-lg border bg-card p-8">
            <h2 className="mb-4 text-2xl font-bold">How It Works</h2>
            <ol className="flex flex-col gap-4 text-muted-foreground">
              <li className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">1</span>
                <span>Create a market by submitting any prediction question</span>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">2</span>
                <span>Our LLM cleans the question and generates resolution criteria</span>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">3</span>
                <span>Run a simulation where 5 AI agents analyze and trade sequentially</span>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">4</span>
                <span>The market probability updates based on LMSR as agents trade</span>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">5</span>
                <span>Review each agent&apos;s reasoning and see how the collective wisdom emerges</span>
              </li>
            </ol>
          </div>
        </section>
      </main>
      <footer className="border-t py-6">
        <div className="container text-center text-sm text-muted-foreground">
          Built with Next.js, Supabase, and AI SDK
        </div>
      </footer>
    </div>
  )
}
