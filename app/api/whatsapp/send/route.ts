import { NextResponse } from "next/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { to, message } = body as {
      to: string;
      message: string;
    };

    if (!to || !message) {
      return NextResponse.json(
        { error: "to and message are required" },
        { status: 400 },
      );
    }

    const result = await sendWhatsAppMessage({ to, message });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Unable to send WhatsApp message" },
      { status: 500 },
    );
  }
}
