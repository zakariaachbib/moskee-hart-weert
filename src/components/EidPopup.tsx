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
      <DialogContent className="max-w-md border-primary/20 [&>button]:hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-gold to-primary rounded-t-lg" />

        <DialogHeader className="pt-4 space-y-3 items-center text-center">
          <p className="text-gold text-3xl" style={{ fontFamily: "Rabat3" }}>
            عيد مبارك
          </p>
          <DialogTitle className="font-heading text-2xl text-foreground text-center">
            Aankondiging Eid-gebed
          </DialogTitle>
          <DialogDescription asChild>
            <div className="text-center space-y-3">
              <span className="block text-lg font-semibold text-foreground">
                ⏰ Aanvang: 08:30 uur
              </span>
              <span className="block text-muted-foreground">
                Het Eid-gebed zal plaatsvinden in de Nahda Moskee. Wij verzoeken iedereen op tijd aanwezig te zijn.
              </span>
              <span className="block text-sm text-muted-foreground/70">
                Moge Allah uw gebeden en goede daden accepteren.
              </span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <Button onClick={() => setOpen(false)} className="w-full mt-2">
          Begrepen
        </Button>
      </DialogContent>
    </Dialog>
  );
}
