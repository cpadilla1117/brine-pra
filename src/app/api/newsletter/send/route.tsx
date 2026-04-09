import { NextResponse } from "next/server";
import { Resend } from "resend";
import { render } from "@react-email/render";
import BrineNewsletter from "@/emails/BrineNewsletter";
import { computeBrineIndex } from "@/lib/compute-index";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const to = body.to as string;
    const weekOffset = typeof body.weekOffset === "number" ? body.weekOffset : 0;

    if (!to) {
      return NextResponse.json(
        { success: false, error: "Missing 'to' field" },
        { status: 400 }
      );
    }

    const data = computeBrineIndex(weekOffset);
    const html = await render(<BrineNewsletter {...data} />);

    const { data: sendData, error } = await resend.emails.send({
      from: "BRINE Intelligence <intelligence@brine.io>",
      to: [to],
      subject: `BRINE Weekly · Issue ${data.issue_number} · ${data.publish_date}`,
      html,
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: sendData?.id });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
