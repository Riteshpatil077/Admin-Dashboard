import Link from 'next/link';
import { ArrowRight, BarChart3, PieChart, TrendingUp } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-950/80 to-slate-950"></div>
      
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-32 sm:py-40 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex justify-center mb-8">
            <div className="bg-blue-600/20 p-4 rounded-full ring-1 ring-blue-500/30">
              <BarChart3 className="w-12 h-12 text-blue-400" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            Analytics Platform
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            A comprehensive, modern dashboard for monitoring financial health, company performance, and critical business metrics all in one place.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/dashboard"
              className="group rounded-full bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg hover:bg-blue-500 hover:shadow-blue-500/30 transition-all duration-300 flex items-center gap-2"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
        
        <div className="mt-20 lg:mt-32 grid grid-cols-1 gap-8 sm:grid-cols-3 max-w-5xl mx-auto">
          <div className="bg-slate-900/50 backdrop-blur-md p-8 rounded-2xl ring-1 ring-white/10 hover:ring-blue-500/50 transition-all">
            <TrendingUp className="w-8 h-8 text-emerald-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Financial Insights</h3>
            <p className="text-slate-400">Track balance dues, invoices, and payment statuses with interactive charts.</p>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-md p-8 rounded-2xl ring-1 ring-white/10 hover:ring-blue-500/50 transition-all">
            <BarChart3 className="w-8 h-8 text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Company Metrics</h3>
            <p className="text-slate-400">Deep dive into performance by company, users count, and overall revenue.</p>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-md p-8 rounded-2xl ring-1 ring-white/10 hover:ring-blue-500/50 transition-all">
            <PieChart className="w-8 h-8 text-purple-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Advanced Analytics</h3>
            <p className="text-slate-400">Analyze patterns and access detailed breakdowns of your daily operations.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
