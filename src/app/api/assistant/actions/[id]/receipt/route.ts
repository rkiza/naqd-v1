import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { receiptHtml } from "@/server/assistant/receipt-html";
import type { ActionPayload } from "@/server/assistant/actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** WeasyPrint invocations to try, in order (CLI, then module). */
const CANDIDATES: Array<[string, string[]]> = [
  ["weasyprint", ["-", "-"]],
  ["python3", ["-m", "weasyprint", "-", "-"]],
];

/**
 * Extra bin dirs where WeasyPrint/Python commonly live. A dev server launched
 * from a GUI (VS Code, Finder) gets a minimal PATH without Homebrew or the
 * python.org framework bins — so resolve them explicitly.
 */
function extraBinDirs(): string[] {
  const dirs = ["/opt/homebrew/bin", "/usr/local/bin"];
  const fw = "/Library/Frameworks/Python.framework/Versions";
  try {
    for (const v of readdirSync(fw)) {
      const bin = `${fw}/${v}/bin`;
      if (existsSync(bin)) dirs.push(bin);
    }
  } catch {
    /* python.org framework not installed */
  }
  return dirs;
}

/** Render HTML → PDF via WeasyPrint (stdin → stdout). */
function renderPdf(html: string): Promise<Buffer> {
  const env = {
    ...process.env,
    PATH: [...extraBinDirs(), process.env.PATH ?? ""].join(":"),
    // Homebrew-installed pango/cairo for non-Homebrew Pythons on macOS.
    DYLD_FALLBACK_LIBRARY_PATH: `/opt/homebrew/lib:${process.env.DYLD_FALLBACK_LIBRARY_PATH ?? ""}`,
  };
  const tryCandidate = (i: number): Promise<Buffer> =>
    new Promise((resolve, reject) => {
      if (i >= CANDIDATES.length) {
        reject(new Error("weasyprint unavailable"));
        return;
      }
      const [cmd, cmdArgs] = CANDIDATES[i];
      const child = spawn(cmd, cmdArgs, { env, stdio: ["pipe", "pipe", "pipe"] });
      const out: Buffer[] = [];
      const err: Buffer[] = [];
      const timer = setTimeout(() => child.kill("SIGKILL"), 30_000);
      child.stdout.on("data", (d: Buffer) => out.push(d));
      child.stderr.on("data", (d: Buffer) => err.push(d));
      child.on("error", () => {
        clearTimeout(timer);
        resolve(tryCandidate(i + 1)); // command missing — try the next invocation
      });
      child.on("close", (code) => {
        clearTimeout(timer);
        const pdf = Buffer.concat(out);
        // %PDF magic guards against a zero-byte or error-text stdout.
        if (code === 0 && pdf.subarray(0, 4).toString() === "%PDF") {
          resolve(pdf);
        } else if (out.length === 0 && i + 1 < CANDIDATES.length) {
          resolve(tryCandidate(i + 1));
        } else {
          reject(new Error(Buffer.concat(err).toString() || `weasyprint exited ${code}`));
        }
      });
      child.stdin.write(html);
      child.stdin.end();
    });
  return tryCandidate(0);
}

/** Download a PDF receipt for one of the caller's executed actions. */
export async function GET(req: Request, { params }: Ctx) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Ownership is part of the query — a foreign action id is a plain 404.
  const action = await prisma.assistantAction.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!action) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (action.status !== "executed") {
    return NextResponse.json({ error: "Receipt available only for executed actions" }, { status: 400 });
  }

  const locale = new URL(req.url).searchParams.get("locale") === "ar" ? "ar" : "en";
  const html = receiptHtml(
    {
      id: action.id,
      type: action.type,
      payload: action.payload as unknown as ActionPayload,
      result: action.result as { newBalance?: number; newCash?: number } | null,
      executedAt: action.executedAt,
    },
    locale,
  );

  try {
    const pdf = await renderPdf(html);
    const reference = action.id.slice(-8).toUpperCase();
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="naqd-receipt-${reference}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("[receipt] WeasyPrint render failed:", err);
    return NextResponse.json(
      { error: "PDF renderer unavailable — install WeasyPrint (pip3 install weasyprint)" },
      { status: 501 },
    );
  }
}
