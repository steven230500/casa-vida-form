import { Resend } from "resend";

let client: Resend | null = null;

function getResend() {
  if (!client) {
    client = new Resend(process.env.RESEND_API_KEY);
  }
  return client;
}

const FROM_ADDRESS = "Casa Vida <no-reply@casavidactg.com>";

export async function sendResponseConfirmation({
  to,
  formTitle,
}: {
  to: string;
  formTitle: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  await getResend().emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `Recibimos tu respuesta: ${formTitle}`,
    text: [
      `¡Gracias por responder "${formTitle}"!`,
      "",
      "Ya recibimos tu información y un miembro de nuestro equipo la revisará pronto.",
      "",
      "Casa Vida",
    ].join("\n"),
  });
}
