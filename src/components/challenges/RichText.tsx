// Met en gras les segments entre ** ** d'un texte de défi.
export function RichText({ text }: { text: string }) {
  const parts = text.split("**");
  return (
    <>
      {parts.map((part, i) => (i % 2 === 1 ? <strong key={i} className="font-semibold text-graphite">{part}</strong> : <span key={i}>{part}</span>))}
    </>
  );
}
