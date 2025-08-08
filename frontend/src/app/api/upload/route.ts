import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const files: File[] = data.getAll('files') as unknown as File[];

  if (!files || files.length === 0) {
    return NextResponse.json({ success: false, error: 'No files uploaded' }, { status: 400 });
  }

  const filePaths: string[] = [];

  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // For now, let's save it to the backend/uploads directory
    const filePath = join(process.cwd(), '../backend/uploads', file.name);
    await writeFile(filePath, buffer);
    filePaths.push(filePath);
  }

  return NextResponse.json({ success: true, files: filePaths });
}
