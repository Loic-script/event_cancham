import QRCode from "qrcode";

type QrCodeProps = {
  value: string;
  size?: number;
  id?: string;
  className?: string;
};

// QR code rendu en SVG côté serveur : aucun script envoyé au navigateur,
// net à toutes les tailles, et facile à télécharger.
export function QrCode({ value, size = 220, id, className }: QrCodeProps) {
  const qr = QRCode.create(value, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const data = qr.modules.data;
  const quiet = 2;

  let d = "";
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (data[y * n + x]) d += `M${x} ${y}h1v1h-1z`;
    }
  }

  const box = n + quiet * 2;
  return (
    <svg
      id={id}
      className={className}
      viewBox={`${-quiet} ${-quiet} ${box} ${box}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`QR code du billet ${value}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x={-quiet} y={-quiet} width={box} height={box} fill="#ffffff" />
      <path d={d} fill="#152019" />
    </svg>
  );
}
