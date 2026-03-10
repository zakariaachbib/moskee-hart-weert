import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Mail, LogIn, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";

export default function AdminLogin() {
  const { t } = useLanguage();
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({ title: t.adminLogin.loginFailed, description: t.adminLogin.loginFailedDesc, variant: "destructive" });
      setLoading(false);
    } else {
      setTimeout(() => { navigate("/admin"); setLoading(false); }, 500);
    }
  };

  return (
    <section className="min-h-[80vh] flex items-center justify-center islamic-pattern">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-8 border border-border shadow-lg w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="bg-gradient-gold w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="text-primary-foreground" size={28} />
          </div>
          <h1 className="font-heading text-2xl text-foreground">{t.adminLogin.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t.adminLogin.subtitle}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{t.adminLogin.emailLabel}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-muted-foreground" size={16} />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-foreground" placeholder="admin@simweert.nl" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{t.adminLogin.password}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-muted-foreground" size={16} />
              <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-12 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-foreground" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-gradient-gold text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
            <LogIn size={16} /> {loading ? t.adminLogin.loggingIn : t.adminLogin.login}
          </button>
        </form>
      </motion.div>
    </section>
  );
}