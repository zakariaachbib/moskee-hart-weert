import { useEffect, useState } from "react";
import { Search, Mail, Trash2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import BeheerderLayout from "@/components/beheerder/BeheerderLayout";
import type { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

type ContactMessage = Tables<"contact_messages">;

const READ_KEY = "beheerder.berichten.read";

function loadRead(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || "[]")); }
  catch { return new Set(); }
}
function saveRead(s: Set<string>) {
  localStorage.setItem(READ_KEY, JSON.stringify([...s]));
}

export default function BeheerderBerichten() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [readSet, setReadSet] = useState<Set<string>>(() => loadRead());

  const fetchMessages = async () => {
    const { data } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
    setMessages(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchMessages(); }, []);

  const markRead = (id: string) => {
    if (readSet.has(id)) return;
    const next = new Set(readSet); next.add(id);
    setReadSet(next); saveRead(next);
  };

  const openMessage = (m: ContactMessage) => {
    setSelected(m);
    markRead(m.id);
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("Weet je zeker dat je dit bericht wilt verwijderen?")) return;
    const { error } = await supabase.from("contact_messages").delete().eq("id", id);
    if (error) { toast({ title: "Fout bij verwijderen", variant: "destructive" }); return; }
    toast({ title: "Bericht verwijderd" });
    if (selected?.id === id) setSelected(null);
    fetchMessages();
  };

  const filtered = messages
    .filter((m) => {
      if (filter === "unread") return !readSet.has(m.id);
      if (filter === "read") return readSet.has(m.id);
      return true;
    })
    .filter((m) =>
      m.naam.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.onderwerp.toLowerCase().includes(search.toLowerCase()) ||
      m.bericht.toLowerCase().includes(search.toLowerCase())
    );

  const counts = {
    all: messages.length,
    unread: messages.filter((m) => !readSet.has(m.id)).length,
    read: messages.filter((m) => readSet.has(m.id)).length,
  };

  return (
    <BeheerderLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Berichten</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            {counts.unread > 0 ? `${counts.unread} ongelezen van ${messages.length}` : `${messages.length} berichten ontvangen`}
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Zoek in berichten..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 h-11 rounded-lg bg-white border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-foreground text-[13px] transition-shadow"
          />
        </div>

        {/* Filter pills */}
        <div className="flex gap-1.5 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-none whitespace-nowrap">
          {(["all", "unread", "read"] as const).map((f) => {
            const active = filter === f;
            const label = f === "all" ? "Alle" : f === "unread" ? "Ongelezen" : "Gelezen";
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "shrink-0 px-3 min-h-[36px] rounded-full text-[12px] font-medium transition-colors flex items-center gap-1",
                  active ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {label}
                <span className="text-[10px] opacity-70">({counts[f]})</span>
              </button>
            );
          })}
        </div>

        {/* Detail view (mobile takes full screen, desktop side-by-side) */}
        {selected ? (
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 sm:p-5 space-y-4">
            <button onClick={() => setSelected(null)} className="text-[12px] text-amber-600 inline-flex items-center gap-1 min-h-[36px]">
              <ArrowLeft size={14} /> Terug naar lijst
            </button>
            <div>
              <h2 className="text-[15px] font-semibold text-foreground">{selected.onderwerp}</h2>
              <p className="text-[12px] text-gray-500 mt-1">
                Van <span className="font-medium text-foreground">{selected.naam}</span> · {selected.email}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {new Date(selected.created_at).toLocaleString("nl-NL", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <p className="text-[13px] text-foreground whitespace-pre-wrap leading-relaxed border-t border-gray-100 pt-3">
              {selected.bericht}
            </p>
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
              <a
                href={`mailto:${selected.email}?subject=Re: ${selected.onderwerp}`}
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 min-h-[44px] rounded-lg text-[13px] font-medium inline-flex items-center gap-2"
              >
                <Mail size={14} /> Beantwoorden
              </a>
              <button
                onClick={() => deleteMessage(selected.id)}
                className="px-4 min-h-[44px] rounded-lg text-[13px] font-medium border border-red-200 text-red-600 hover:bg-red-50 inline-flex items-center gap-2 transition-colors"
              >
                <Trash2 size={14} /> Verwijderen
              </button>
            </div>
          </div>
        ) : loading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Mail size={36} className="mx-auto text-gray-300 mb-2" />
            <p className="text-[13px] text-gray-500">Geen berichten</p>
          </div>
        ) : (
          <ul className="bg-white border border-gray-100 rounded-xl shadow-sm divide-y divide-gray-100 overflow-hidden">
            {filtered.map((m) => {
              const unread = !readSet.has(m.id);
              return (
                <li key={m.id} className="relative">
                  <button
                    onClick={() => openMessage(m)}
                    className="w-full text-left p-3 sm:p-4 pr-12 hover:bg-gray-50/60 transition-colors flex items-start gap-3 min-h-[64px]"
                  >
                    <span
                      className={cn(
                        "shrink-0 mt-2 w-2 h-2 rounded-full",
                        unread ? "bg-amber-500" : "bg-gray-300"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn("text-[13px] truncate", unread ? "font-semibold text-foreground" : "font-medium text-gray-600")}>
                          {m.naam}
                        </p>
                        <span className="text-[11px] text-gray-400 shrink-0">
                          {new Date(m.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                      <p className="text-[12px] text-amber-600 truncate mt-0.5">{m.onderwerp}</p>
                      <p className="text-[12px] text-gray-500 truncate">{m.bericht}</p>
                    </div>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteMessage(m.id); }}
                    className="absolute top-1/2 -translate-y-1/2 right-2 w-11 h-11 flex items-center justify-center rounded-lg text-gray-400 hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Verwijderen"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </BeheerderLayout>
  );
}
