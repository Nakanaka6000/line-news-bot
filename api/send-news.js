const line = require('@line/bot-sdk');
const fetch = require('node-fetch');

// LINE Bot SDKのクライアントを初期化
const client = new line.Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
});

// Finnhub APIのベースURLとAPIキー
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const API_KEY = process.env.FINNHUB_API_KEY;

/**
 * ドル円の為替レートを取得する
 */
async function getUsdJpyRate() {
  // Finnhubでは直接的な為替レートペアの提供が限定的なため、ここではダミーデータを返します。
  // 実際のプロジェクトでは、対応する為替API(例: Alpha Vantage)に置き換える必要があります。
  // 今回は例として固定値を返します。
  return 150.25; 
}

/**
 * S&P 500の指数を取得する
 */
async function getSP500() {
  const url = `${FINNHUB_BASE_URL}/quote?symbol=^GSPC&token=${API_KEY}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Finnhub API error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Finnhub API response:', data); // デバッグ用ログを追加
    return data.c; // c は現在価格 (current price)
  } catch (error) {
    console.error('Error fetching S&P 500 data:', error);
    return null;
  }
}

/**
 * Vercelのサーバーレス関数ハンドラ
 */
export default async function handler(req, res) {
  // GETリクエスト以外は405 Method Not Allowedを返す
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // 各金融データを並行して取得
    const [usdJpy, sp500] = await Promise.all([
      getUsdJpyRate(),
      getSP500()
    ]);

    // メッセージを作成
    const messageText = `【朝の金融ニュース】

・USD/JPY: ${usdJpy} 円
・S&P 500: ${sp500}`;

    // LINEにプッシュメッセージを送信
    await client.pushMessage(process.env.LINE_USER_ID, {
      type: 'text',
      text: messageText,
    });

    // 成功レスポンスを返す
    res.status(200).json({ message: 'Message sent successfully!' });

  } catch (error) {
    console.error('Error in handler:', error);
    // エラーレスポンスを返す
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}