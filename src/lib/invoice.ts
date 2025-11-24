import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";

interface InvoiceItem {
  nom: string;
  quantite: number;
  prix: number;
  sousTotal: number;
}

interface InvoicePayload {
  commandeId: string;
  dateCommande: Date;
  utilisateur: {
    username: string;
    email: string;
  };
  adresseLivraison: {
    rue: string;
    ville: string;
    codePostal: string;
    pays: string;
    telephone: string;
  };
  items: InvoiceItem[];
  montantTotal: number;
  methodePaiement: "especes" | "carte" | "paypal";
  paiementDetails?: {
    titulaire?: string;
    numeroMasque?: string;
    expiration?: string;
    paypalEmail?: string;
    transactionId?: string;
  };
}

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

const formatDate = (date: Date | string) =>
  new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(date));

export async function generateInvoicePdf(payload: InvoicePayload) {
  const invoicesDir = path.join(process.cwd(), "public", "invoices");
  await fs.promises.mkdir(invoicesDir, { recursive: true });

  const fileName = `facture-${payload.commandeId}-${Date.now()}.pdf`;
  const filePath = path.join(invoicesDir, fileName);

  const pdfDoc = await PDFDocument.create();
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  let page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  let cursorY = A4_HEIGHT - 60;

  const drawText = (
    text: string,
    options: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb> } = {}
  ) => {
    if (cursorY < 80) {
      cursorY = A4_HEIGHT - 60;
      page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
    }

    const font = options.bold ? boldFont : regularFont;
    const size = options.size ?? 12;

    const lines = text.split("\n");
    lines.forEach((line) => {
      page.drawText(line, {
        x: 50,
        y: cursorY,
        size,
        font,
        color:
          options.color ??
          (line.includes("Merci") ? rgb(0.4, 0.4, 0.4) : rgb(0, 0, 0)),
      });
      cursorY -= size + 6;
    });
  };

  const drawSectionTitle = (title: string) => {
    drawText(title, { size: 14, bold: true });
    cursorY -= 4;
  };

  drawText("Facture de commande", { size: 20, bold: true });
  cursorY -= 10;
  drawText(`Commande #${payload.commandeId}`);
  drawText(`Date : ${formatDate(payload.dateCommande)}`);
  cursorY -= 4;

  drawSectionTitle("Client");
  drawText(`Nom : ${payload.utilisateur.username}`);
  drawText(`Email : ${payload.utilisateur.email}`);
  cursorY -= 4;

  drawSectionTitle("Adresse de livraison");
  drawText(payload.adresseLivraison.rue);
  drawText(`${payload.adresseLivraison.ville}, ${payload.adresseLivraison.codePostal}`);
  drawText(payload.adresseLivraison.pays);
  drawText(`Téléphone : ${payload.adresseLivraison.telephone}`);
  cursorY -= 4;

  drawSectionTitle("Paiement");
  drawText(`Méthode : ${payload.methodePaiement.toUpperCase()}`);
  if (payload.methodePaiement === "carte" && payload.paiementDetails) {
    drawText(`Titulaire : ${payload.paiementDetails.titulaire ?? "-"}`);
    drawText(`Carte : ${payload.paiementDetails.numeroMasque ?? "-"}`);
    drawText(`Expiration : ${payload.paiementDetails.expiration ?? "-"}`);
  } else if (payload.methodePaiement === "paypal" && payload.paiementDetails) {
    drawText(`Email PayPal : ${payload.paiementDetails.paypalEmail ?? "-"}`);
    drawText(`Transaction : ${payload.paiementDetails.transactionId ?? "-"}`);
  } else {
    drawText("Paiement à la livraison");
  }
  cursorY -= 4;

  drawSectionTitle("Articles");
  payload.items.forEach((item) => {
    drawText(
      `${item.nom} • x${item.quantite} — ${item.prix.toFixed(2)} DT | Sous-total : ${item.sousTotal.toFixed(2)} DT`
    );
  });
  cursorY -= 4;

  drawText(`Montant total : ${payload.montantTotal.toFixed(2)} DT`, { bold: true, size: 14 });
  cursorY -= 12;
  drawText("Merci pour votre achat.", { size: 10, color: rgb(0.4, 0.4, 0.4) });

  const pdfBytes = await pdfDoc.save();
  await fs.promises.writeFile(filePath, pdfBytes);
  return `/invoices/${fileName}`;
}

