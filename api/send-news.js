const line = require('@line/bot-sdk');
const fetch = require('node-fetch');

// LINE Bot SDKのクライアントを初期化
const client = new line.Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
});

// Alpha Vantage APIのAPIキー
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

/**
 * ドル円の為替レートを取得する
 */
async function getUsdJpyRate() {
  const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=JPY&apikey=${API_KEY}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    // APIの応答から為替レートを抽出
    const rate = data['Realtime Currency Exchange Rate']['5. Exchange Rate'];
    return parseFloat(rate).toFixed(2); // 小数点以下2桁にフォーマット
  } catch (error) {
    console.error('Error fetching USD/JPY rate:', error);
    console.error('Alpha Vantage API response for Forex:', await error.response?.json());
    return '取得失敗';
  }
}

/**
 * S&P 500の指数を取得する
 */
async function getSP500() {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=SPY&apikey=${API_KEY}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    // APIの応答から株価を抽出 (S&P500に連動するETFであるSPYを利用)
    const price = data['Global Quote']['05. price'];
    return parseFloat(price).toFixed(2); // 小数点以下2桁にフォーマット
  } catch (error) {
    console.error('Error fetching S&P 500 data:', error);
    console.error('Alpha Vantage API response for S&P500:', await error.response?.json());
    return '取得失敗';
  }
}

/**
 * Vercelのサーバーレス関数ハンドラ
 */
export default async function handler(req, res) {
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
    const messageText = `【朝の金融ニュース】\n\n・USD/JPY: ${usdJpy} 円\n・S&P 500: ${sp500}`;

    // LINEにプッシュメッセージを送信
    await client.pushMessage(process.env.LINE_USER_ID, {
      type: 'text',
      text: messageText,
    });

    res.status(200).json({ message: 'Message sent successfully!' });

  } catch (error) {
    console.error('Error in handler:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
