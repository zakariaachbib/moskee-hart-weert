import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Mail, LogIn, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

function getRedirectPath(eduRole: string | null, isAdmin: boolean | null): string {
  // Mosque admin (superadmin) goes to mosque admin dashboard
  if (isAdmin) return "/admin";
  if (eduRole === "admin") return "/education/admin";
  if (eduRole === "education_management") return "/education/management";
  if (eduRole === "teacher") return "/education/teacher";
  if (eduRole === "student") return "/education/student";
  return "/";
}

export default function Login() {
  const { signIn, user, eduRole, isAdmin, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already logged in and roles fully resolved
  useEffect(() => {
    if (!loading && user) {
      const path = getRedirectPath(eduRole, isAdmin);
      navigate(path, { replace: true });
    }
  }, [user, eduRole, isAdmin, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({
        title: "Inloggen mislukt",
        description: "Controleer je e-mailadres en wachtwoord.",
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }
    // Fallback: if redirect doesn't happen within 8s, stop spinner
    setTimeout(() => setSubmitting(false), 8000);
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-background islamic-pattern">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl p-8 border border-border shadow-lg w-full max-w-md mx-4"
      >
        <div className="text-center mb-8">
          <div className="bg-gradient-gold w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="text-primary-foreground" size={28} />
          </div>
          <h1 className="font-heading text-2xl text-foreground">Inloggen</h1>
          <p className="text-muted-foreground text-sm mt-1">Log in met je account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">E-mailadres</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-muted-foreground" size={16} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-foreground"
                placeholder="je@email.nl"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Wachtwoord</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-muted-foreground" size={16} />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-foreground"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-gold text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <LogIn size={16} /> {submitting ? "Bezig met inloggen..." : "Inloggen"}
          </button>
        </form>
      </motion.div>
    </section>
  );
}
