import OpenAI from 'openai';

export async function analyzeGrooming(body: any) {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI APIキーが設定されていないため、モックデータを返します。');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
    return {
      total: 82,
      comments: "全体的に清潔感がありますが、あと一歩でさらに好印象になります！",
      parts: {
        faceFront: 85,
        faceSide: 80,
        hands: 75,
        upperBody: 90
      },
      advice: {
        today: ["爪を短く切る", "鼻毛の最終チェック"],
        fewDays: ["美容室で少し髪を整える"],
        longTerm: ["定期的なスキンケアの習慣化"]
      }
    };
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const { photos, selfCheck, daysRemaining, tone, skippedParts } = body;

  // Prepare text prompt
  let prompt = `あなたはプロの婚活アドバイザーであり、スタイリストです。提供された画像とセルフチェック結果をもとに、ユーザーの身だしなみを厳しくかつ建設的に診断してください。\n\n`;

  prompt += `【最重要ルール】\n`;
  prompt += `- 画像が不鮮明・暗すぎる・人物が映っていない・情報が不十分な場合は、その部位を「判定不能」として扱い、スコアを出力しないこと\n`;
  prompt += `- 「問題が見当たらない」と「判定できない」はまったく別の状態である。情報不足の場合は必ず「判定不能」と返すこと\n`;
  prompt += `- 必須部位（顔正面・顔側面・手）のうち2部位以上が判定不能な場合は、totalをnullにして "undiagnosable": true を返すこと\n\n`;
  
  prompt += `【フィードバックのトーン】\n`;
  if (tone === 'strict') {
    prompt += `ズバリ率直に、問題点を指摘してください。「〜はNGです」「〜は必須です」等の表現を使用してください。\n\n`;
  } else {
    prompt += `やさしく、ポジティブに表現してください。「〜するとより好印象です」等の表現を使用してください。\n\n`;
  }

  prompt += `【お見合い・デートまでの残り日数】\n${daysRemaining}日\n\n`;

  prompt += `【セルフチェック回答】\n`;
  prompt += `- 鼻毛の処理: ${selfCheck.noseHair ? 'できている' : 'できていない'}\n`;
  prompt += `- 体臭・口臭対策: ${selfCheck.bodyOdor ? '気にならない/対策済み' : '気になる/未対策'}\n`;
  prompt += `- 美容室来店(直近2-3週間): ${selfCheck.haircut ? '行った' : '行っていない'}\n`;
  prompt += `- 整髪料のつけすぎ: ${selfCheck.hairWax ? 'つけすぎている' : '適量'}\n\n`;

  prompt += `【未撮影（スキップ）部位】\n`;
  prompt += skippedParts.length > 0 ? skippedParts.join(', ') : 'なし';
  prompt += `\n※スキップされた部位については減点せず、スコア計算から除外してください。\n\n`;

  prompt += `以下の要件を満たすJSONフォーマットで回答してください：\n`;
  prompt += `{
  "undiagnosable": true または false,
  "undiagnosableReason": "undiagnosableがtrueの場合のみ、理由を日本語で記載（例：顔の画像が不鮮明で判定できませんでした）",
  "total": 総合スコア（65〜95の整数。100点は不可。undiagnosableがtrueの場合はnull）,
  "comments": "総合スコアに応じた一言コメント（undiagnosableがtrueの場合はnull）",
  "parts": {
    // 判定可能だった部位のみスコア（65〜95）を返す
    // 判定不能な部位は "undiagnosable" という文字列を返す
    // 例: "faceFront": 75, "faceSide": "undiagnosable"
  },
  "advice": {
    "today": ["今日すぐできる改善アクション（残り1日以下の場合はこれのみ）"],
    "fewDays": ["2〜3日で解決できるアクション（残り日数2日以上の場合のみ）"],
    "longTerm": ["長期的に取り組むべきアクション（残り日数4日以上の場合のみ）"]
  }
}`;

  // Prepare messages array for OpenAI
  const messages: any[] = [
    { role: "system", content: "You are a helpful assistant designed to output pure JSON." },
    {
      role: "user",
      content: [
        { type: "text", text: prompt }
      ]
    }
  ];

  // Append images
  for (const [part, base64] of Object.entries(photos)) {
    if (typeof base64 === 'string' && base64.startsWith('data:image')) {
      messages[1].content.push({
        type: "image_url",
        image_url: {
          url: base64,
          detail: "auto"
        }
      });
    }
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: messages,
    response_format: { type: "json_object" },
    max_tokens: 1000,
  });

  const resultText = response.choices[0].message.content;
  if (!resultText) {
    throw new Error("No response from OpenAI");
  }

  const jsonResult = JSON.parse(resultText);

  return jsonResult;
}
