import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'プライバシーポリシー | 身だしなみチェック',
  description: '身だしなみチェックアプリのプライバシーポリシー',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-12 leading-relaxed">
      <h1 className="text-2xl font-bold mb-2">プライバシーポリシー</h1>
      <p className="text-sm text-slate-500 mb-10">最終更新日: 2026年8月6日</p>

      <p className="mb-8">
        「身だしなみチェック」（以下「本アプリ」）は、個人開発者である高橋由華（以下「開発者」）が提供する、お見合い・デート前の身だしなみをAIで診断するアプリケーションです。本ポリシーは、本アプリの利用に伴い取得する情報の取り扱いについて説明します。
      </p>

      <Section title="1. 取得する情報">
        <p className="mb-3">本アプリでは、アカウント登録やログインは必要ありません。氏名・メールアドレス・電話番号などの個人を特定できる情報は取得しません。本アプリの利用に伴い、以下の情報を取り扱います。</p>
        <ul className="list-disc list-inside space-y-2">
          <li>
            <strong>撮影した写真（顔情報を含む）</strong>: 本アプリは、顔・手・上半身・靴などの写真を撮影していただき、身だしなみ診断のためだけに使用します。このうち顔の写真（顔の画像そのものであり、顔認証等に用いる生体認証データへの変換は行いません）は、診断のために撮影のたびに第三者であるOpenAI, L.L.C.のAPIへ送信され、診断結果の生成にのみ利用されます。写真はお使いの端末上で一時的に処理されるのみで、開発者が管理するサーバーやデータベースに保存・蓄積されることはなく、診断結果の生成後は送信した写真データを保持しません。写真をAIモデルの学習に利用したり、診断目的以外で第三者に提供したりすることはありません。アプリ初回起動時に、この内容へのご同意をアプリ内で確認しています。
          </li>
          <li>
            <strong>セルフチェックの回答・希望のフィードバックのトーン・お見合い/デートの予定日</strong>: 診断結果を作成するために使用し、お使いの端末内にのみ保存されます。
          </li>
          <li>
            <strong>診断結果・診断回数</strong>: 直近の診断結果と、無料診断の利用回数を、お使いの端末内にのみ保存します。開発者のサーバーには送信・保存されません。
          </li>
          <li>
            <strong>購入情報</strong>: アプリ内課金（買い切りプラン）をご利用の場合、購入処理はApple社および決済管理サービスのRevenueCat社を通じて行われます。開発者はクレジットカード情報等の決済情報を直接取得することはありません。
          </li>
        </ul>
      </Section>

      <Section title="2. 情報の第三者提供・委託先">
        <p className="mb-3">本アプリは、以下の第三者サービスを利用しています。それぞれの情報の取り扱いは、各社のプライバシーポリシーに従います。</p>
        <ul className="list-disc list-inside space-y-2">
          <li>
            <strong>OpenAI, L.L.C.</strong>: 身だしなみ診断のAI解析のため、撮影した写真をAPI経由で送信します。OpenAI社のAPI利用規約に基づき取り扱われ、モデルの学習には使用されません。
          </li>
          <li>
            <strong>Apple Inc.</strong>: アプリ内課金（App内課金）の決済処理のため。
          </li>
          <li>
            <strong>RevenueCat, Inc.</strong>: アプリ内課金の状態管理のため、購入履歴や端末の識別子（個人を特定しない形式）を処理します。
          </li>
          <li>
            <strong>Vercel Inc.</strong>: 本アプリのAI診断機能を提供するサーバー（API）のホスティングのため。
          </li>
        </ul>
        <p className="mt-3">上記以外の目的で、取得した情報を第三者に販売・提供することはありません。</p>
      </Section>

      <Section title="3. データの保存場所と削除">
        <p>
          撮影した写真そのものは、診断処理が終わった後、開発者のサーバー内に保存されません。セルフチェックの回答・診断結果・診断回数などのアプリの利用状況は、お使いの端末内にのみ保存されます。本アプリをアンインストールすることで、端末内に保存されたこれらの情報はすべて削除されます。
        </p>
      </Section>

      <Section title="4. 広告・トラッキングについて">
        <p>本アプリは広告を表示しません。また、広告目的でのトラッキング（IDFA等の広告識別子の収集）は行いません。</p>
      </Section>

      <Section title="5. お子様のプライバシー">
        <p>本アプリは、婚活・デートを控えた成人の利用を想定しており、13歳未満のお子様による利用を意図していません。13歳未満のお子様から意図せず情報を取得したことが判明した場合、速やかに削除します。</p>
      </Section>

      <Section title="6. セキュリティ">
        <p>写真および各種情報の送受信には、通信の暗号化（HTTPS）を使用しています。ただし、インターネットを通じた情報伝送の安全性を完全に保証するものではありません。</p>
      </Section>

      <Section title="7. 本ポリシーの変更">
        <p>本ポリシーの内容は、法令の変更や本アプリの機能追加等に伴い、予告なく変更されることがあります。重要な変更がある場合は、本ページ上でお知らせします。</p>
      </Section>

      <Section title="8. お問い合わせ">
        <p>
          本ポリシーに関するご質問・ご意見は、下記までご連絡ください。
          <br />
          開発者: 高橋由華
          <br />
          お問い合わせ先: <a href="mailto:yukachristina1991@gmail.com" className="text-blue-600 underline">yukachristina1991@gmail.com</a>
        </p>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold mb-3">{title}</h2>
      {children}
    </section>
  );
}
