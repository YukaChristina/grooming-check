import { NextResponse } from 'next/server';
import { analyzeGrooming } from '@/services/analyzerService';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Call the decoupled business logic service
    const jsonResult = await analyzeGrooming(body);

    return NextResponse.json(jsonResult);
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || '診断中にエラーが発生しました。' }, { status: 500 });
  }
}
