import { useEffect, useState } from "react";
import { Search, Mail, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import type { Tables } from "@/integrations/supabase/types";

type ContactMessage = Tables<"contact_messages">;

export default function AdminBerichten() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ContactMessage | null>(null);

  const fetchMessages = async () => {
    const { data } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
    setMessages(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchMessages(); }, []);

  const deleteMessage = async (id: string) => {
    if (!confirm("Weet je zeker dat je dit bericht wilt verwijderen?")) return;
    const { error } = await supabase.from("contact_messages").delete().eq("id", id);
    if (error) { toast({ title: "Fout bij verwijderen", variant: "destructive" }); return; }
    toast({ title: "Bericht verwijderd" });
    if (selected?.id === id) setSelected(null);
    fetchMessages();
  };

  const filtered = messages.filter((m) =>
    m.naam.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    m.onderwerp.toLowerCase().includes(search.toLowerCase()) ||
    m.bericht.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl text-foreground">Berichten</h1>
          <p className="text-sm text-muted-foreground mt-1">{messages.length} contactberichten ontvangen</p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Zoek in berichten..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border focus:border-primary outline-none text-foreground text-sm"
          />
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Messages List */}
          <div className="lg:col-span-2 space-y-2">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-card rounded-xl animate-pulse" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <Mail size={32} className="mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-muted-foreground">Geen berichten gevonden</p>
              </div>
            ) : (
              filtered.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelected(m)}
                  className={`w-full text-left bg-card rounded-xl p-4 border transition-all relative group ${
                    selected?.id === m.id ? "border-primary shadow-sm" : "border-border hover:border-primary/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-foreground truncate">{m.naam}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                      {new Date(m.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <p className="text-xs text-primary font-medium truncate">{m.onderwerp}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{m.bericht}</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteMessage(m.id); }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                    title="Verwijderen"
                  >
                    <Trash2 size={12} />
                  </button>
                </button>
              ))
            )}
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-3">
            {selected ? (
              <div className="bg-card rounded-2xl border border-border p-6 sticky top-8">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-heading text-xl text-foreground">{selected.onderwerp}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Van <span className="font-medium text-foreground">{selected.naam}</span> · {selected.email}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(selected.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="border-t border-border pt-4">
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{selected.bericht}</p>
                </div>
                <div className="border-t border-border pt-4 mt-6">
                  <a
                    href={`mailto:${selected.email}?subject=Re: ${selected.onderwerp}`}
                    className="bg-gradient-gold text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2"
                  >
                    <Mail size={14} /> Beantwoorden
                  </a>
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-2xl border border-border p-12 text-center">
                <Mail size={40} className="mx-auto text-muted-foreground/20 mb-3" />
                <p className="text-muted-foreground">Selecteer een bericht om te lezen</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
