// src/app/api/send-email/route.ts
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, receiptId, name, amount, zakatType } = body;

    // Create transporter (configure this with your email provider)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email content in Malay
    const mailOptions = {
      from: process.env.EMAIL_FROM || "zakatpay@example.com",
      to: email,
      subject: "Pengesahan Pembayaran Zakat Anda",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
          <div style="background-color: #10B981; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h2>Pembayaran Zakat Berjaya!</h2>
          </div>
          
          <div style="padding: 20px;">
            <p>Assalamualaikum ${name},</p>
            
            <p>Terima kasih atas pembayaran zakat anda. Kami ingin memaklumkan bahawa pembayaran anda telah berjaya diproses.</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Butiran Pembayaran:</strong></p>
              <p>No. Resit: <strong>${receiptId}</strong></p>
              <p>Jenis Zakat: ${zakatType}</p>
              <p>Jumlah: RM${amount}</p>
              <p>Tarikh: ${new Date().toLocaleDateString("ms-MY")}</p>
            </div>
            
            <p>Pembayaran zakat anda telah direkodkan secara digital dalam sistem kami. Anda boleh melihat dan muat turun resit pembayaran dengan klik butang di bawah:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:3000/receipt/${receiptId}" style="background-color: #10B981; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Lihat Resit Pembayaran</a>
            </div>
            
            <p>Jika anda mempunyai sebarang pertanyaan, sila hubungi pihak kami di <a href="mailto:support@zakatpay.com">support@zakatpay.com</a>.</p>
            
            <p>Semoga Allah memberkati harta dan kehidupan anda.</p>
            
            <p>Terima kasih,<br>Pasukan ZakatPay</p>
          </div>
          
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px;">
            <p>© ${new Date().getFullYear()} ZakatPay - Sistem Pembayaran Zakat Digital</p>
          </div>
        </div>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email sending failed:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
