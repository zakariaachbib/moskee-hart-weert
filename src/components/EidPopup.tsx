import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function EidPopup() {
  const [open, setOpen] = useState(true);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md text-center border-primary/20">
        {/* Decorative top accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-gold to-primary rounded-t-lg" />

        <DialogHeader className="pt-4 space-y-3">
          <p className="text-gold text-2xl" style={{ fontFamily: "Rabat3" }}>
            عيد مبارك
          </p>
          <DialogTitle className="font-heading text-2xl text-foreground">
            Eid-gebed
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-base space-y-2">
            <span className="block text-lg font-semibold text-foreground">
              ⏰ Aanvang: 08:30 uur
            </span>
            <span className="block">
              Het Eid-gebed vindt plaats in de Nahda Moskee. Wij verzoeken iedereen op tijd aanwezig te zijn.
            </span>
            <span className="block text-sm text-muted-foreground/70">
              Moge Allah uw gebeden en goede daden accepteren.
            </span>
          </DialogDescription>
        </DialogHeader>

        <Button onClick={() => setOpen(false)} className="mt-2 w-full">
          Begrepen
        </Button>
      </DialogContent>
    </Dialog>
  );
}
