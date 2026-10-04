import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { RotateCcw, RotateCw } from "lucide-react";

async function cropImage(src: string, area: Area, rotation: number): Promise<File> {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src;
  });
  const rad = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad)), cos = Math.abs(Math.cos(rad));
  const bw = img.width * cos + img.height * sin, bh = img.width * sin + img.height * cos;
  const full = document.createElement("canvas");
  full.width = bw; full.height = bh;
  const fctx = full.getContext("2d")!;
  fctx.translate(bw / 2, bh / 2); fctx.rotate(rad); fctx.drawImage(img, -img.width / 2, -img.height / 2);
  const out = document.createElement("canvas");
  out.width = area.width; out.height = area.height;
  out.getContext("2d")!.drawImage(full, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);
  const blob = await new Promise<Blob>((res) => out.toBlob((b) => res(b!), "image/jpeg", 0.92));
  return new File([blob], "lijst.jpg", { type: "image/jpeg" });
}

export function PhotoCropDialog({ file, onCancel, onDone }: { file: File | null; onCancel: () => void; onDone: (f: File) => void }) {
  const [src, setSrc] = useState<string>("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!file) return;
    const u = URL.createObjectURL(file);
    setSrc(u); setCrop({ x: 0, y: 0 }); setZoom(1); setRotation(0);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const onComplete = useCallback((_: Area, px: Area) => setArea(px), []);

  const confirm = async () => {
    if (!area) return;
    setBusy(true);
    try { onDone(await cropImage(src, area, rotation)); } finally { setBusy(false); }
  };

  return (
    <Dialog open={!!file} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Bijsnijden en rechtzetten</DialogTitle></DialogHeader>
        <div className="relative h-80 w-full overflow-hidden rounded-md bg-muted">
          {src && (
            <Cropper image={src} crop={crop} zoom={zoom} rotation={rotation} aspect={undefined as unknown as number}
              objectFit="contain" onCropChange={setCrop} onZoomChange={setZoom} onRotationChange={setRotation} onCropComplete={onComplete} />
          )}
        </div>
        <div className="space-y-3" dir="ltr">
          <div className="flex items-center gap-3 text-sm">
            <span className="w-20">Zoom</span>
            <Slider min={1} max={4} step={0.05} value={[zoom]} onValueChange={(v) => setZoom(v[0])} />
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="w-20">Rechtzetten</span>
            <Slider min={-45} max={45} step={0.5} value={[((rotation + 45) % 90 + 90) % 90 - 45]}
              onValueChange={(v) => setRotation(Math.round(rotation / 90) * 90 + v[0])} />
          </div>
          <div className="flex justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setRotation((r) => r - 90)}><RotateCcw className="h-4 w-4 mr-1" />90°</Button>
            <Button variant="outline" size="sm" onClick={() => setRotation((r) => r + 90)}><RotateCw className="h-4 w-4 mr-1" />90°</Button>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>Annuleren</Button>
          <Button variant="outline" onClick={() => file && onDone(file)}>Origineel gebruiken</Button>
          <Button onClick={confirm} disabled={busy || !area}>Uitlezen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
