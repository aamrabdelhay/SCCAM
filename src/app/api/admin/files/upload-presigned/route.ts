import { NextRequest } from "next/server";
import { issueSignedToken } from "@vercel/blob";
import {
  handleUploadPresigned,
  type HandleUploadPresignedBody,
} from "@vercel/blob/client";
import { one } from "@/lib/db";
import { adminGuard } from "@/lib/admin-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const denied = await adminGuard();
  if (denied) return denied;

  try {
    const body = await request.json() as HandleUploadPresignedBody;
    const result = await handleUploadPresigned({
      body,
      request,
      webhookPublicKey: process.env.BLOB_WEBHOOK_PUBLIC_KEY,
      getSignedToken: async (pathname) => {
        const pending = await one<{
          mime: string;
          size_bytes: number;
        }>(
          "SELECT mime, size_bytes FROM file_versions WHERE storage_key = ? AND text_status = 'uploading'",
          [pathname],
        );
        if (!pending) throw new Error("upload-not-authorized");

        const validUntil = Date.now() + 10 * 60 * 1000;
        const token = await issueSignedToken({
          pathname,
          operations: ["put"],
          validUntil,
          allowedContentTypes: [pending.mime],
          maximumSizeInBytes: Number(pending.size_bytes),
        });

        return {
          token,
          urlOptions: {
            validUntil: Date.now() + 8 * 60 * 1000,
            allowedContentTypes: [pending.mime],
            maximumSizeInBytes: Number(pending.size_bytes),
            addRandomSuffix: false,
            allowOverwrite: true,
          },
        };
      },
    });

    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[admin/files/upload-presigned] failed", message);
    return Response.json({ error: message }, { status: 400 });
  }
}
