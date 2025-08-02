/*
 * Copyright 2025 hivelogic pvt ltd, singapore
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
