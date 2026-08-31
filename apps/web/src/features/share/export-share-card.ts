import { toPng } from "html-to-image";

export async function exportShareCard(node: HTMLElement, size = { width: 1080, height: 1920 }): Promise<Blob> {
  await document.fonts?.ready;
  const dataUrl = await toPng(node, { width: size.width, height: size.height, canvasWidth: size.width, canvasHeight: size.height, pixelRatio: 1, cacheBust: true });
  const blob = await (await fetch(dataUrl)).blob();
  if (blob.type !== "image/png") throw new Error("SHARE_EXPORT_NOT_PNG");
  return blob;
}

export async function shareBlob(blob: Blob, filename: string): Promise<"shared" | "downloaded"> {
  const file = new File([blob], filename, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] }) && navigator.share) { await navigator.share({ files: [file], title: "WEGO" }); return "shared"; }
  const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 0); return "downloaded";
}
