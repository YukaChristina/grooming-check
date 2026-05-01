import * as fs from 'fs';
import * as path from 'path';

const IMAGE_DIR = path.join(__dirname, '..', 'test-images');
const RESULTS_FILE = path.join(__dirname, '..', 'test-results.json');

// ファイル名のスペースは全角スペース（　）。ただし face_front_beard のみ半角スペース2つ
const S = '　'; // 全角スペース

const FILES: Record<string, string> = {
  blank:              '真っ暗.jpg',
  wall:               '壁.jpg',
  blurry:             'ブレている.jpg',
  too_dark:           `暗過ぎる.jpg`,
  finger_cover:       '指で隠れている.jpg',
  object_only:        '物体.jpg',
  face_front_good:    `顔${S}正面${S}ひげ${S}清潔.jpg`,
  face_front_beard:   `顔${S}正面${S}ひげ剃り残しあり  寝ぐせ.jpg`,
  face_side_good:     `顔${S}側面${S}ひげなし${S}清潔.jpg`,
  face_side_beard:    `顔${S}側面${S}ひげ剃り残しあり.jpg`,
  hands_good:         `指${S}きれい.jpg`,
  hands_long:         `指${S}長い爪.jpg`,
  hands_dry:          `指${S}ささくれ.png`,
  upperbody_wrinkled: `全身${S}シャツ乱れ.jpg`,
  upperbody_oversize: `全身${S}オーバーサイズ.jpg`,
  upperbody_good:     `全身${S}清潔.png`,
};

function img(key: string): string {
  const filename = FILES[key];
  if (!filename) {
    console.warn(`⚠️  Unknown key: ${key}`);
    return '';
  }
  const filepath = path.join(IMAGE_DIR, filename);
  if (!fs.existsSync(filepath)) {
    console.warn(`⚠️  Missing image: ${filename}`);
    return '';
  }
  const ext = path.extname(filename).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
  return `data:${mime};base64,${fs.readFileSync(filepath).toString('base64')}`;
}

const DEFAULT_SELF_CHECK = {
  noseHair: true,
  bodyOdor: true,
  haircut: true,
  hairWax: false,
};

type Params = {
  photos: Record<string, string>;
  selfCheck: typeof DEFAULT_SELF_CHECK;
  daysRemaining: number;
  tone: 'strict' | 'gentle';
  skippedParts: string[];
};

async function analyze(params: Params) {
  const res = await fetch('http://localhost:3000/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

const TEST_CASES: { name: string; params: Params }[] = [
  // ── 🔴 異常系 (TC-A) ──────────────────────────────────────────
  {
    name: 'TC-A01 ｜ 必須3部位すべて判定不能 → undiagnosable期待',
    params: {
      photos: {
        faceFront: img('blank'),
        faceSide:  img('blank'),
        hands:     img('blank'),
      },
      selfCheck: DEFAULT_SELF_CHECK,
      daysRemaining: 7,
      tone: 'gentle',
      skippedParts: [],
    },
  },
  {
    name: 'TC-A02 ｜ 必須2部位が判定不能 → undiagnosable期待',
    params: {
      photos: {
        faceFront: img('blank'),
        faceSide:  img('wall'),
        hands:     img('hands_good'),
      },
      selfCheck: DEFAULT_SELF_CHECK,
      daysRemaining: 7,
      tone: 'gentle',
      skippedParts: [],
    },
  },
  {
    name: 'TC-A03 ｜ 必須1部位のみ判定不能 → faceFrontのみundiagnosable・total算出期待',
    params: {
      photos: {
        faceFront: img('blank'),
        faceSide:  img('face_side_good'),
        hands:     img('hands_good'),
      },
      selfCheck: DEFAULT_SELF_CHECK,
      daysRemaining: 7,
      tone: 'gentle',
      skippedParts: [],
    },
  },
  {
    name: 'TC-A04 ｜ ぼやけた顔画像 → faceFrontのみundiagnosable期待',
    params: {
      photos: {
        faceFront: img('blurry'),
        faceSide:  img('face_side_good'),
        hands:     img('hands_good'),
      },
      selfCheck: DEFAULT_SELF_CHECK,
      daysRemaining: 7,
      tone: 'gentle',
      skippedParts: [],
    },
  },
  {
    name: 'TC-A05 ｜ 指で隠れた画像 → undiagnosable期待',
    params: {
      photos: {
        faceFront: img('finger_cover'),
        faceSide:  img('wall'),
        hands:     img('blank'),
      },
      selfCheck: DEFAULT_SELF_CHECK,
      daysRemaining: 7,
      tone: 'gentle',
      skippedParts: [],
    },
  },

  // ── 🟢 正常系 (TC-N) ──────────────────────────────────────────
  {
    name: 'TC-N01 ｜ オールグリーン → total 85〜95・100点なし期待',
    params: {
      photos: {
        faceFront: img('face_front_good'),
        faceSide:  img('face_side_good'),
        hands:     img('hands_good'),
      },
      selfCheck: DEFAULT_SELF_CHECK,
      daysRemaining: 7,
      tone: 'gentle',
      skippedParts: [],
    },
  },
  {
    name: 'TC-N02 ｜ ひげ問題のみ → ひげ関連アドバイスがtodayに期待',
    params: {
      photos: {
        faceFront: img('face_front_beard'),
        faceSide:  img('face_side_beard'),
        hands:     img('hands_good'),
      },
      selfCheck: DEFAULT_SELF_CHECK,
      daysRemaining: 7,
      tone: 'gentle',
      skippedParts: [],
    },
  },
  {
    name: 'TC-N03 ｜ 爪問題のみ → 爪関連アドバイスがtodayに期待',
    params: {
      photos: {
        faceFront: img('face_front_good'),
        faceSide:  img('face_side_good'),
        hands:     img('hands_long'),
      },
      selfCheck: DEFAULT_SELF_CHECK,
      daysRemaining: 7,
      tone: 'gentle',
      skippedParts: [],
    },
  },
  {
    name: 'TC-N04 ｜ セルフチェック全問題あり → 鼻毛・体臭・美容室アドバイス期待',
    params: {
      photos: {
        faceFront: img('face_front_good'),
        faceSide:  img('face_side_good'),
        hands:     img('hands_good'),
      },
      selfCheck: { noseHair: false, bodyOdor: false, haircut: false, hairWax: true },
      daysRemaining: 7,
      tone: 'gentle',
      skippedParts: [],
    },
  },
  {
    name: 'TC-N05 ｜ 手の乾燥・ささくれ → 手ケアアドバイス期待',
    params: {
      photos: {
        faceFront: img('face_front_good'),
        faceSide:  img('face_side_good'),
        hands:     img('hands_dry'),
      },
      selfCheck: DEFAULT_SELF_CHECK,
      daysRemaining: 7,
      tone: 'gentle',
      skippedParts: [],
    },
  },

  // ── 🟡 組み合わせ (TC-C) ──────────────────────────────────────
  {
    name: 'TC-C01 ｜ ひげ＋爪＋服装の3問題同時 → 3点アドバイス期待',
    params: {
      photos: {
        faceFront: img('face_front_beard'),
        faceSide:  img('face_side_beard'),
        hands:     img('hands_long'),
        upperBody: img('upperbody_wrinkled'),
      },
      selfCheck: DEFAULT_SELF_CHECK,
      daysRemaining: 7,
      tone: 'gentle',
      skippedParts: [],
    },
  },
  {
    name: 'TC-C02 ｜ 残り日数0日 → todayのみ・fewDays/longTermなし期待',
    params: {
      photos: {
        faceFront: img('face_front_beard'),
        faceSide:  img('face_side_beard'),
        hands:     img('hands_long'),
      },
      selfCheck: DEFAULT_SELF_CHECK,
      daysRemaining: 0,
      tone: 'gentle',
      skippedParts: [],
    },
  },
  {
    name: 'TC-C03 ｜ 残り日数7日 → 3区分すべてアドバイス期待',
    params: {
      photos: {
        faceFront: img('face_front_beard'),
        faceSide:  img('face_side_beard'),
        hands:     img('hands_dry'),
      },
      selfCheck: DEFAULT_SELF_CHECK,
      daysRemaining: 7,
      tone: 'gentle',
      skippedParts: [],
    },
  },
  {
    name: 'TC-C04a ｜ トーン：strict → 「NGです」等の率直表現期待',
    params: {
      photos: {
        faceFront: img('face_front_beard'),
        faceSide:  img('face_side_beard'),
        hands:     img('hands_long'),
      },
      selfCheck: DEFAULT_SELF_CHECK,
      daysRemaining: 5,
      tone: 'strict',
      skippedParts: [],
    },
  },
  {
    name: 'TC-C04b ｜ トーン：gentle → 「好印象」等のやさしい表現期待',
    params: {
      photos: {
        faceFront: img('face_front_beard'),
        faceSide:  img('face_side_beard'),
        hands:     img('hands_long'),
      },
      selfCheck: DEFAULT_SELF_CHECK,
      daysRemaining: 5,
      tone: 'gentle',
      skippedParts: [],
    },
  },
  {
    name: 'TC-C05 ｜ オーバーサイズ → サイズ感コメント期待（精度限界確認）',
    params: {
      photos: {
        faceFront: img('face_front_good'),
        faceSide:  img('face_side_good'),
        hands:     img('hands_good'),
        upperBody: img('upperbody_oversize'),
      },
      selfCheck: DEFAULT_SELF_CHECK,
      daysRemaining: 7,
      tone: 'gentle',
      skippedParts: [],
    },
  },
];

async function main() {
  const results: { name: string; output: unknown; error?: string }[] = [];

  console.log('=== Grooming Check API Test ===\n');

  for (const tc of TEST_CASES) {
    process.stdout.write(`${tc.name} ... `);

    // 画像が1枚も読み込めていない場合はスキップ
    const validPhotos = Object.fromEntries(
      Object.entries(tc.params.photos).filter(([, v]) => v !== '')
    );
    if (Object.keys(validPhotos).length === 0) {
      console.log('⏭  SKIPPED (no images)');
      results.push({ name: tc.name, output: null, error: 'skipped: no images' });
      continue;
    }

    try {
      const output = await analyze({ ...tc.params, photos: validPhotos });
      if (output.undiagnosable) {
        console.log(`❌ undiagnosable — ${output.undiagnosableReason ?? ''}`);
      } else {
        const advice = output.advice ?? {};
        const todayItems: string[]    = advice.today    ?? [];
        const fewDaysItems: string[]  = advice.fewDays  ?? [];
        const longTermItems: string[] = advice.longTerm ?? [];
        console.log(`✅ total=${output.total} | today=${todayItems.length} fewDays=${fewDaysItems.length} longTerm=${longTermItems.length}`);

        // TC-A03/A04: partsの判定不能確認
        if (tc.name.startsWith('TC-A03') || tc.name.startsWith('TC-A04')) {
          const undiagParts = Object.entries(output.parts ?? {})
            .filter(([, v]) => v === 'undiagnosable')
            .map(([k]) => k);
          console.log(`   → 判定不能部位: ${undiagParts.join(', ') || 'なし'}`);
        }
        // TC-N02〜N05: adviceのtodayを表示してアドバイス内容を確認
        if (/TC-N0[2-5]/.test(tc.name)) {
          todayItems.forEach(item => console.log(`   今日: ${item}`));
        }
        // TC-C02: fewDays/longTermが空かチェック
        if (tc.name.startsWith('TC-C02')) {
          console.log(`   → fewDays空: ${fewDaysItems.length === 0} / longTerm空: ${longTermItems.length === 0}`);
        }
        // TC-C03: 3区分すべて埋まっているかチェック
        if (tc.name.startsWith('TC-C03')) {
          console.log(`   → 3区分揃い: ${todayItems.length > 0 && fewDaysItems.length > 0 && longTermItems.length > 0}`);
        }
        // TC-C04: アドバイス1件目を表示してトーン比較
        if (tc.name.startsWith('TC-C04') && todayItems.length > 0) {
          console.log(`   → "${todayItems[0]}"`);
        }
      }
      results.push({ name: tc.name, output });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`💥 ERROR: ${msg}`);
      results.push({ name: tc.name, output: null, error: msg });
    }

    // レート制限対策：テスト間に2秒待機
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\n✅ Results saved → test-results.json`);
}

main();
