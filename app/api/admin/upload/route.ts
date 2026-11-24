import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import fs from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "general";

    if (!file) {
      return NextResponse.json(
        { error: "File tidak ditemukan dalam permintaan." },
        { status: 400 }
      );
    }

    // Validate size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Ukuran file melebihi batas maksimal 5MB." },
        { status: 400 }
      );
    }

    // Validate MIME types
    const ALLOWED_MIME = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/svg+xml",
      "image/gif",
    ];
    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Format file tidak didukung. Harap unggah file JPEG, PNG, WebP, atau SVG.",
        },
        { status: 400 }
      );
    }

    // Generate safe unique filename
    const cleanFolderName = folder.replace(/[^a-zA-Z0-9_-]/g, "");
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileName = `${timestamp}-${randomSuffix}.${extension}`;
    const filePath = `${cleanFolderName}/${fileName}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ─── 1. Attempt upload to Supabase Storage bucket 'pea-assets' ───────────
    try {
      const supabase = createClient();
      if (supabase) {
        const { error: uploadError } = await supabase.storage
          .from("pea-assets")
          .upload(filePath, buffer, {
            contentType: file.type,
            upsert: true,
          });

        if (!uploadError) {
          const {
            data: { publicUrl },
          } = supabase.storage.from("pea-assets").getPublicUrl(filePath);

          if (publicUrl) {
            return NextResponse.json({
              success: true,
              url: publicUrl,
              path: filePath,
              storage: "supabase",
            });
          }
        } else {
          console.warn("Supabase Storage upload returned error, falling back to local file storage:", uploadError.message);
        }
      }
    } catch (supabaseErr) {
      console.warn("Supabase client error in upload route, falling back to local storage:", supabaseErr);
    }

    // ─── 2. Fallback to Local Public File Storage (guaranteed to succeed) ──
    try {
      const targetDir = path.join(process.cwd(), "public", "uploads", cleanFolderName);
      await fs.mkdir(targetDir, { recursive: true });
      const targetFilePath = path.join(targetDir, fileName);
      await fs.writeFile(targetFilePath, buffer);

      const localPublicUrl = `/uploads/${cleanFolderName}/${fileName}`;
      return NextResponse.json({
        success: true,
        url: localPublicUrl,
        path: filePath,
        storage: "local",
      });
    } catch (localWriteErr: any) {
      console.error("Local file write error:", localWriteErr);
      return NextResponse.json(
        { error: `Gagal menyimpan file logo: ${localWriteErr.message}` },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error("Storage upload general error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal mengunggah file ke storage." },
      { status: 500 }
    );
  }
}
