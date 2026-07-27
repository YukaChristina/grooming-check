# 課金機能の実装（買い切りIAP → 将来サブスク移行を見据えた設計）

## Context

現在の身だしなみチェックアプリ（Expo/React Native, `mobile/`）は完全無料で、診断のたびにOpenAI Vision APIを呼んでいる。API利用料の回収は将来的にマスト事項だが、目下の最優先は「早くApp Storeにリリースして仮説検証すること」。

議論の結果、以下の方針が確定した：
- **初回3回までは無料**、それ以降は**買い切り（非消耗型IAP）**で無制限に利用可能にする
- 買い切りを選ぶ理由: 実装が最も速い（サーバー側DB・ユーザー識別・月次リセットが一切不要）。トレードオフとして「支払い後は使い放題＝ヘビーユーザーのAPIコストが青天井」というリスクは検証フェーズでは許容する
- ただし将来的にサブスクへ切り替える前提があるため、**RevenueCatを購入処理の抽象化レイヤーとして最初から導入**し、後の切り替えコストを最小化する
- Apple App Store Connect側の「有料アプリ契約」は現在サイン手続き中

## スコープ外（このセッションでは実施しない/できない）

- サーバー側（Supabase等）での利用回数計測・ユーザー認証 — 今回は端末ローカル（Zustandのpersist）のみで完結させる
- App Store ConnectでのIAP商品登録、RevenueCatアカウント作成・APIキー発行・Entitlement/Offering設定 — 外部アカウント作業のためユーザー側で実施
- 実際の購入・復元購入のSandbox実機テスト — ユーザー側で実施
- `eas submit` によるストア提出

## 重要な環境変化（要認識）

`react-native-purchases`（RevenueCat SDK）はネイティブモジュールを含むため、これまでの「Expo Goだけで完結する」開発フローが変わる。

- Expo Go上ではSDKが自動的に「Preview APIモード」（JSモック）に切り替わりクラッシュはしないが、**実際の購入は一切テストできない**
- 今回このプロジェクトは初めて ios/android のネイティブビルド（Development Build）が必要になる（現状は `eas.json` も `ios/` `android/` フォルダも存在しない、フルmanagedワークフロー）
- 購入フローの動作確認には `eas build --profile development` で作ったDevelopment Buildを実機にインストールする必要がある（この構築・配布はユーザー側の作業）

## 実装方針

### 1. 依存関係
`cd mobile && npx expo install react-native-purchases` のみ追加。UIキット（`react-native-purchases-ui`）は使わず、既存画面と統一感のある自作Paywall画面にする。

### 2. `mobile/services/purchaseService.ts`（新規）
RevenueCatとのやり取りを1箇所に集約する。将来サブスクに切り替える際、呼び出し側（画面・store）は変更せず、この関数の中身だけ差し替えられるようにするのが狙い。
- `configurePurchases()`: `Purchases.configure({ apiKey })` — App.tsx起動時に1回呼ぶ
- `getPremiumStatus(): Promise<boolean>`: `Purchases.getCustomerInfo()` の `entitlements.active` に `"premium"` が含まれるかを判定
- `purchasePremium(): Promise<boolean>`: `getOfferings()` → 買い切り商品を購入
- `restorePurchases(): Promise<boolean>`: 復元購入（Appleのレビュー要件として必須）

### 3. `mobile/store/useAppStore.ts`（既存ファイルを拡張）
- `diagnosisCount: number` を追加し、`persist`の`partialize`対象にも含める（既存の`eventDate`/`tone`/`skippedParts`/`score`と同様の並び）
- `incrementDiagnosisCount()` アクションを追加
- `isPremium: boolean` をランタイム状態として追加（persist対象外。起動時とpurchase成功時にRevenueCatの結果で同期する）

診断カウントの増加タイミングは、`Step4Camera.tsx`の`performAnalysis()`内、`useAppStore.getState().setScore(data)` が呼ばれる成功パス（＝診断が実際に完了した時点）。再撮影やエラー時にはカウントしない。

### 4. ゲート判定
`FREE_DIAGNOSIS_LIMIT = 3` を定数化し、「`diagnosisCount >= FREE_DIAGNOSIS_LIMIT && !isPremium`」を上限到達判定として一元化する。判定タイミングは、Step4Cameraの`overview`画面（「これから撮影する部位」）で「撮影を始める」を押した瞬間。上限到達時は`guide`画面に進む代わりに新設の`Paywall`画面を表示する（`captureStep`に`'paywall'`を追加する形で、既存の内部ステートマシンパターンを踏襲）。

### 5. `mobile/screens/Paywall.tsx`（新規）
既存画面と同じNativeWindスタイルで構成：
- 「無料診断を3回使い切りました」等の説明文
- `getOfferings()`から取得した価格の表示
- 「購入して続ける」ボタン → `purchasePremium()` → 成功時は`isPremium`をtrueにしてoverview画面へ戻す
- 「購入を復元」リンク → `restorePurchases()`
- 「戻る」ボタン（既存の`text-xl`戻るボタンと統一）

### 6. `mobile/App.tsx`
起動時（`useEffect`）に`configurePurchases()`→`getPremiumStatus()`を呼び、結果を`useAppStore`の`isPremium`に反映する初期化処理を追加。

## ユーザー側で必要な作業（コーディング範囲外）

- App Store Connect: 有料アプリ契約の完了、Non-Consumable IAP商品の登録（Product ID・価格帯設定）
- RevenueCatアカウント作成 → アプリ登録 → App Store Connect API Key連携 → Entitlement（`premium`）作成 → 商品をEntitlementに紐付け → Offering作成
- RevenueCatのiOS用APIキーを`mobile/.env`に追加（例: `EXPO_PUBLIC_REVENUECAT_IOS_KEY`）
- `eas.json`の作成＋`eas build --profile development`でDevelopment Buildを作成し実機で購入フローを確認
- Sandboxテスターアカウントでの実購入・復元購入の動作確認

## 検証方法

- `npx tsc --noEmit`、`npx expo export --platform ios` でのコード健全性確認
- 実際の課金・エンタイトルメント取得はDevelopment Build配布後でないと確認できないため、ロジック面（3回でPaywallに遷移する分岐、購入成功後にゲートが解除される状態遷移）はコードレビューで担保する

## 将来のサブスク移行時にやること（メモ）

- RevenueCatダッシュボードで新しいサブスク商品を作成し、同じ`premium` Entitlementに紐付ける（アプリ側のコード変更は最小限で済むはず）
- `diagnosisCount`のリセットロジック（月次）を`useAppStore`に追加
- Paywall画面の文言・価格表示をサブスク向けに更新
