import { ThemeToggle } from "@/components/theme-toggle"
import { LoginClientWrapper } from "@/components/login/login-client-wrapper"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">MC</span>
            </div>
            <h1 className="text-2xl font-bold">Mini CRM</h1>
          </div>
          <ThemeToggle />
        </div>

        <LoginClientWrapper />

        <p className="text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Mini CRM. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}
