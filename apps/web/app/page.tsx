import Link from 'next/link'
import {
  Users, Clock, CalendarDays, DollarSign, TrendingUp, BookOpen,
  Receipt, FileText, BarChart3, GitBranch, Briefcase, Check, ArrowRight,
} from 'lucide-react'

const FEATURES = [
  { icon: Users, title: 'Employee Management', desc: 'Centralise all employee data, documents, and org structure in one place.' },
  { icon: Clock, title: 'Attendance Tracking', desc: 'Track clock-ins, clock-outs, WFH days, and late arrivals effortlessly.' },
  { icon: CalendarDays, title: 'Leave Management', desc: 'Configurable leave types, balances, carry-forward, and approval workflows.' },
  { icon: DollarSign, title: 'Payroll Processing', desc: 'Run payroll with auto-computed PF, ESIC, TDS, and LOP deductions.' },
  { icon: Briefcase, title: 'Recruitment', desc: 'Post jobs, track candidates through your pipeline, and hire faster.' },
  { icon: TrendingUp, title: 'Performance Reviews', desc: 'Set goals, track progress, and conduct structured performance reviews.' },
  { icon: BookOpen, title: 'Learning & Development', desc: 'Publish courses and track employee learning progress.' },
  { icon: Receipt, title: 'Expense Management', desc: 'Employees submit claims; managers approve — all in a few clicks.' },
  { icon: FileText, title: 'Documents', desc: 'Store offer letters, contracts, and all employee documents securely.' },
  { icon: GitBranch, title: 'Org Chart', desc: 'Visualise your reporting hierarchy with an interactive org chart.' },
  { icon: BarChart3, title: 'HR Reports', desc: 'Headcount trends, attendance summaries, payroll analytics, and more.' },
]

const PLANS = [
  {
    name: 'Starter',
    price: '₹999',
    limit: 'Up to 25 employees',
    features: ['Core HR & Org Chart', 'Attendance & Leave', 'Payroll Processing', 'Billing & Invoicing'],
    cta: 'Start free trial',
    highlight: false,
  },
  {
    name: 'Growth',
    price: '₹1,999',
    limit: 'Up to 75 employees',
    features: ['Everything in Starter', 'Recruitment (ATS)', 'Performance Reviews', 'Learning & Expenses', 'Advanced Reports'],
    cta: 'Start free trial',
    highlight: true,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <span className="font-bold text-lg tracking-tight">Klickkk HR</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(59,130,246,0.15),_transparent_60%)]" />
        <div className="relative max-w-6xl mx-auto px-6 py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium px-4 py-1.5 rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Modern HRMS built for Indian businesses
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight mb-6">
            HR management that{' '}
            <span className="text-blue-400">actually works</span>
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-10">
            From onboarding to payroll, Klickkk HR handles your entire employee lifecycle — so you can focus on building your team, not managing spreadsheets.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-colors"
            >
              Start 7-day free trial
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-sm transition-colors border border-white/10"
            >
              Sign in to your workspace
            </Link>
          </div>
          <p className="mt-5 text-xs text-slate-500">No credit card required · GST invoices included · Cancel anytime</p>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold">Everything your HR team needs</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">
              A complete suite of HR tools in one platform — no integrations needed.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                  <f.icon size={20} className="text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold">Simple, transparent pricing</h2>
            <p className="text-slate-500 mt-3">
              All prices include 18% GST. Extra employee slots available at ₹49/slot/month.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 border-2 ${
                  plan.highlight ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white'
                }`}
              >
                {plan.highlight && (
                  <div className="text-xs font-semibold bg-white/20 text-white px-3 py-1 rounded-full inline-block mb-4">
                    Most popular
                  </div>
                )}
                <h3 className={`text-xl font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                  {plan.name}
                </h3>
                <div className={`text-3xl font-extrabold mb-1 ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                  {plan.price}
                  <span className={`text-sm font-normal ml-1 ${plan.highlight ? 'text-blue-200' : 'text-slate-400'}`}>
                    / month
                  </span>
                </div>
                <p className={`text-sm mb-6 ${plan.highlight ? 'text-blue-200' : 'text-slate-400'}`}>{plan.limit}</p>
                <ul className="space-y-2 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check size={15} className={plan.highlight ? 'text-blue-200' : 'text-green-500'} />
                      <span className={plan.highlight ? 'text-blue-50' : 'text-slate-700'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`block text-center py-3 rounded-xl font-semibold text-sm transition-colors ${
                    plan.highlight
                      ? 'bg-white text-blue-600 hover:bg-blue-50'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">K</span>
            </div>
            <span className="font-semibold text-slate-600">Klickkk HR</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-slate-600 transition-colors">Sign in</Link>
            <Link href="/signup" className="hover:text-slate-600 transition-colors">Sign up</Link>
          </div>
          <p>© {new Date().getFullYear()} Klickkk. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
