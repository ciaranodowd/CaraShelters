export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-lg">C</div>
            <span className="text-2xl font-bold text-primary">Cara</span>
          </div>
          <p className="text-sm text-muted-foreground">Animal shelter management for Ireland & Europe</p>
        </div>
        {children}
      </div>
    </div>
  )
}
