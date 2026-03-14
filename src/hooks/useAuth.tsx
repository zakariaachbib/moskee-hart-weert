import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type EduRole = "admin" | "education_management" | "teacher" | "student" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean | null;
  eduRole: EduRole;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [eduRole, setEduRole] = useState<EduRole>(null);
  const [loading, setLoading] = useState(true);

  const resolveRoles = async (userId: string) => {
    setIsAdmin(null);
    setEduRole(null);
    try {
      const adminPromise = supabase
        .rpc("has_role", { _user_id: userId, _role: "admin" })
        .then(({ data, error }) => {
          if (error) throw error;
          return !!data;
        });

      const eduPromise = supabase
        .rpc("get_edu_role", { _user_id: userId })
        .then(({ data, error }) => {
          if (error) throw error;
          return (data as EduRole) || null;
        });

      const [adminResult, eduResult] = await Promise.all([
        Promise.race([adminPromise, new Promise<boolean>((r) => setTimeout(() => r(false), 4000))]),
        Promise.race([eduPromise, new Promise<EduRole>((r) => setTimeout(() => r(null), 4000))]),
      ]);

      setIsAdmin(adminResult);
      setEduRole(eduResult);
    } catch {
      setIsAdmin(false);
      setEduRole(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await resolveRoles(session.user.id);
        } else {
          setIsAdmin(false);
          setEduRole(null);
          setLoading(false);
        }
      } catch {
        setSession(null);
        setUser(null);
        setIsAdmin(false);
        setEduRole(null);
        setLoading(false);
      }
    };
    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setLoading(true);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await resolveRoles(session.user.id);
      } else {
        setIsAdmin(false);
        setEduRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setEduRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, eduRole, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
