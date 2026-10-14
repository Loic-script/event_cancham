export type PagePdf = { titre: string; lignes: string[] };

const VERS_WINANSI: Record<string, number> = { "’": 0x92, "‘": 0x91, "“": 0x93, "”": 0x94, "–": 0x96, "—": 0x97, "…": 0x85, "€": 0x80 };

function encoder(texte: string): string {
  let sortie = "";
  for (const c of texte.normalize("NFC")) {
    const code = VERS_WINANSI[c] ?? c.codePointAt(0) ?? 63;
    const octet = code <= 0xff ? code : 63;
    const car = String.fromCharCode(octet);
    sortie += car === "\\" || car === "(" || car === ")" ? `\\${car}` : car;
  }
  return sortie;
}

export function pdfSimple(pages: PagePdf[]): Buffer {
  const objets: string[] = [];
  const ajoute = (s: string) => {
    objets.push(s);
    return objets.length;
  };
  const catalogue = ajoute("");
  const arbre = ajoute("");
  const police = ajoute("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  const policeGrasse = ajoute("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  const enfants: number[] = [];
  pages.forEach((p, index) => {
    let flux = `0.07 0.19 0.35 rg 0 742 595 100 re f 0.95 0.42 0.11 rg 0 736 595 6 re f 1 1 1 rg BT /F2 24 Tf 50 782 Td (${encoder(p.titre)}) Tj ET 0.12 0.15 0.2 rg`;
    let y = 690;
    for (const ligne of p.lignes) {
      flux += ` BT /F1 13 Tf 50 ${y} Td (${encoder(ligne)}) Tj ET`;
      y -= 22;
    }
    flux += ` 0.45 0.5 0.56 rg BT /F1 10 Tf 50 40 Td (${encoder(`CanCham Madagascar · Page ${index + 1} / ${pages.length}`)}) Tj ET`;
    const contenu = ajoute(`<< /Length ${Buffer.byteLength(flux, "latin1")} >>\nstream\n${flux}\nendstream`);
    enfants.push(ajoute(`<< /Type /Page /Parent ${arbre} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${police} 0 R /F2 ${policeGrasse} 0 R >> >> /Contents ${contenu} 0 R >>`));
  });
  objets[catalogue - 1] = `<< /Type /Catalog /Pages ${arbre} 0 R >>`;
  objets[arbre - 1] = `<< /Type /Pages /Kids [${enfants.map((k) => `${k} 0 R`).join(" ")}] /Count ${enfants.length} >>`;
  let sortie = "%PDF-1.4\n%\xe2\xe3\xcf\xd3\n";
  const positions: number[] = [];
  objets.forEach((o, i) => {
    positions.push(Buffer.byteLength(sortie, "latin1"));
    sortie += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = Buffer.byteLength(sortie, "latin1");
  sortie += `xref\n0 ${objets.length + 1}\n0000000000 65535 f \n${positions.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objets.length + 1} /Root ${catalogue} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(sortie, "latin1");
}
