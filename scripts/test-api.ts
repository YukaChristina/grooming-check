import * as fs from 'fs';
import * as path from 'path';

const IMAGE_DIR = path.join(__dirname, '..', 'test-images');
const RESULTS_FILE = path.join(__dirname, '..', 'test-results.json');

const FILES: Record<string, string> = {
  blank:              '真っ暗.jpg',
  wall:               '壁.jpg',
  blurry:             'ブレている.jpg',
  too_dark:           '暗過ぎる.jpg',
  finger_cover:       '指で隠れている.jpg',
  object_only:        '物体.jpg',
  face_front_good:    '顔 正面 ひげ 清潔.jpg',
  face_front_beard:   '顔 正面 ひげ剃り残しあり 寝ぐせ.jpg',
  face_side_good:     '顔 側面 ひげなし 清潔.jpg',
  face_side_beard:    '顔 側面 ひげ剃り残しあり.jpg',
  hands_good:         '指 きれい.jpg',
  hands_long:         '指 長い爪.jpg',
  hands_dry:          '指 ささくれ.jpg',
  upperbody_wrinkled: '全身 シャツ乱れ.jpg',
  upperbody_oversize: '全身 オーバーサイズ.jpg',
  upperbody_good:     '全身 清潔.jpg',
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
  return `data:image/jpeg;base64,${fs.readFileSync(filepath).toString('base64')}`;
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
  {
    name: '① 真っ暗画像 → undiagnosable期待',
    params: {
      photos: { faceFront: img('blank') },
      selfCheck: DEFAULT_SELF_CHECK,
      daysRemaining: 7,
      tone: 'gentle',
      skippedParts: ['faceSide', 'hands'],
    },
  },
  {
    name: '② 壁の画像 → undiagnosable期待',
    params: {
      photos: { faceFront: img('wall') },
      selfCheck: DEFAULT_SELF_CHECK,
      daysRemaining: 7,
      tone: 'gentle',
      skippedParts: ['faceSide', 'hands'],
    },
  },
  {
    name: '③ ブレた画像 → undiagnosable期待',
    params: {
      photos: { faceFront: img('blurry') },
      selfCheck: DEFAULT_SELF_CHECK,
      daysRemaining: 7,
      tone: 'gentle',
      skippedParts: ['faceSide', 'hands'],
    },
  },
  {
    name: '④ 暗過ぎる画像 → undiagnosable期待',
    params: {
      photos: { faceFront: img('too_dark') },
      selfCheck: DEFAULT_SELF_CHECK,
      daysRemaining: 7,
      tone: 'gentle',
      skippedParts: ['faceSide', 'hands'],
    },
  },
  {
    name: '⑤ 指で隠れている → undiagnosable期待',
    params: {
      photos: { faceFront: img('finger_cover') },
      selfCheck: DEFAULT_SELF_CHECK,
      daysRemaining: 7,
      tone: 'gentle',
      skippedParts: ['faceSide', 'hands'],
    },
  },
  {
    name: '⑥ 物体のみ → undiagnosable期待',
    params: {
      photos: { faceFront: img('object_only') },
      selfCheck: DEFAULT_SELF_CHECK,
      daysRemaining: 7,
      tone: 'gentle',
      skippedParts: ['faceSide', 'hands'],
    },
  },
  {
    name: '⑦ 清潔な顔（正面＋側面）＋手 → スコアあり',
    params: {
      photos: {
        faceFront: img('face_front_good'),
        faceSide: img('face_side_good'),
        hands: img('hands_good'),
      },
      selfCheck: DEFAULT_SELF_CHECK,
      daysRemaining: 7,
      tone: 'gentle',
      skippedParts: [],
    },
  },
  {
    name: '⑧ ひげ剃り残しあり（正面＋側面）→ 減点期待',
    params: {
      photos: {
        faceFront: img('face_front_beard'),
        faceSide: img('face_side_beard'),
        hands: img('hands_good'),
      },
      selfCheck: { ...DEFAULT_SELF_CHECK, noseHair: false },
      daysRemaining: 3,
      tone: 'strict',
      skippedParts: [],
    },
  },
  {
    name: '⑨ 長い爪 → 減点期待',
    params: {
      photos: {
        faceFront: img('face_front_good'),
        faceSide: img('face_side_good'),
        hands: img('hands_long'),
      },
      selfCheck: DEFAULT_SELF_CHECK,
      daysRemaining: 5,
      tone: 'gentle',
      skippedParts: [],
    },
  },
  {
    name: '⑩ ささくれあり → 減点期待',
    params: {
      photos: {
        faceFront: img('face_front_good'),
        faceSide: img('face_side_good'),
        hands: img('hands_dry'),
      },
      selfCheck: DEFAULT_SELF_CHECK,
      daysRemaining: 5,
      tone: 'gentle',
      skippedParts: [],
    },
  },
  {
    name: '⑪ 全身 清潔 → スコアあり',
    params: {
      photos: {
        faceFront: img('face_front_good'),
        faceSide: img('face_side_good'),
        hands: img('hands_good'),
        upperBody: img('upperbody_good'),
      },
      selfCheck: DEFAULT_SELF_CHECK,
      daysRemaining: 7,
      tone: 'gentle',
      skippedParts: [],
    },
  },
  {
    name: '⑫ シャツ乱れ → 減点期待',
    params: {
      photos: {
        faceFront: img('face_front_good'),
        faceSide: img('face_side_good'),
        hands: img('hands_good'),
        upperBody: img('upperbody_wrinkled'),
      },
      selfCheck: DEFAULT_SELF_CHECK,
      daysRemaining: 5,
      tone: 'strict',
      skippedParts: [],
    },
  },
  {
    name: '⑬ オーバーサイズ → 減点期待',
    params: {
      photos: {
        faceFront: img('face_front_good'),
        faceSide: img('face_side_good'),
        hands: img('hands_good'),
        upperBody: img('upperbody_oversize'),
      },
      selfCheck: DEFAULT_SELF_CHECK,
      daysRemaining: 5,
      tone: 'strict',
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
      const label = output.undiagnosable
        ? `❌ undiagnosable — ${output.undiagnosableReason ?? ''}`
        : `✅ total=${output.total}`;
      console.log(label);
      results.push({ name: tc.name, output });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`💥 ERROR: ${msg}`);
      results.push({ name: tc.name, output: null, error: msg });
    }
  }

  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\n✅ Results saved → test-results.json`);
}

main();
