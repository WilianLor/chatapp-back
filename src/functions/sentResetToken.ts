import nodemailer from "nodemailer";
import "../services/env";

interface SendMailProps {
  to: string;
  resetToken: string;
}

const sendResetToken = async ({ to, resetToken }: SendMailProps) => {
  const transporterOptions: any = {
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  };

  const transporter = nodemailer.createTransport(transporterOptions);

  const htmlContent = `
  <header>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500;600;700&display=swap"
      rel="stylesheet"
    />
    <style>
      html {
        font-family: Barlow;
      }
      body {
        display: flex;
        flex-direction: column;
        width: 100%;
        align-items: center;
        justify-content: center;
        background-color: #f0eded;
        padding-bottom: 1rem;
      }
      .code-content {
        font-size: 4rem;
        font-weight: 700;
        color: #00e6b0;
        background-color: #fff;
        padding: 1.5rem;
        border-radius: 1rem;
        margin-top: 1rem;
        margin-bottom: 1rem;
      }
      p {
        font-size: 1.25rem;
        color: #33404f;
        font-weight: 400;
        width: 60%;
        text-align: center;
      }
    </style>
  </header>
  <body>
    <div class="code-content">${resetToken}</div>
    <p>
      Este é o código que você precisa para poder efetuar o alteração da sua
      senha. Lembre-se que ele só é válido por 5 minutos, então corra!
    </p>
  </body>
  `;

  const mailOptions = {
    from: "contact@chatapp.com",
    to: to,
    subject: "Seu codigo do ChatApp é " + resetToken,
    html: htmlContent,
  };

  await transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    }
  });
};

export default sendResetToken;
