import nodemailer from "nodemailer";
import templates from "./email";

export async function sendMail({ from, to, subject, category, data }) {
  const mailData = {
    from,
    to,
    subject,
    text: `Text???`,
    html: templates[category](data),
    category,
  };

  const transport = nodemailer.createTransport({
    host: "live.smtp.mailtrap.io",
    port: 587,
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASS,
    },
  });

  transport.sendMail(mailData, (error, info) => {
    if (error) {
      console.log(error);
      return;
    }
    console.log(`Message sent: ${info}`);
  });

  return Response.json({ msg: "ok" });
}
