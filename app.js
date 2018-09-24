const clova = require('@line/clova-cek-sdk-nodejs');
const express = require('express');
const fetch = require('node-fetch');

const clovaSkillHandler = clova.Client
    .configureSkill()

    //起動時に喋る
    .onLaunchRequest(responseHelper => {
        responseHelper.setSimpleSpeech({
            lang: 'ja',
            type: 'PlainText',
            value: '天気を元にアラームを設定します。',
        });
    })

    //ユーザーからの発話が来たら反応する箇所
    .onIntentRequest(async responseHelper => {
        const intent = responseHelper.getIntentName();
        const sessionId = responseHelper.getSessionId();

        console.log('Intent:' + intent);
        if(intent === 'alarm_clock'){
            const slots = responseHelper.getSlots();
            console.log('slots:' + slots);

            //デフォルトのスピーチ内容を記載 - 該当スロットがない場合をデフォルト設定
            let speech = {
                lang: 'ja',
                type: 'PlainText',
                value: '不明な時間です。'
            }
            const city = '471010' // 那覇固定

            return fetch(`http://weather.livedoor.com/forecast/webservice/json/v1?city=${city}`).then(res => {
                return res.json();
            }).then(json => {
                const tomorrowWeather = json.forecasts[1].telop;

                console.log(tomorrowWeather);

                let minutes = 0;

                if (tomorrowWeather.match(/雨/)) {
                    minutes = 30;
                } else if (tomorrowWeather.match(/曇/)) {
                    minutes = 15;
                }
                speech.value = `明日の天気は${tomorrowWeather}なので${slots.time}の${minutes}分前にアラームを設定しました`;

                responseHelper.setSimpleSpeech(speech);
                responseHelper.setSimpleSpeech(speech, true);
            });
        }
    })

    //終了時
    .onSessionEndedRequest(responseHelper => {
        const sessionId = responseHelper.getSessionId();
    })
    .handle();


const app = new express();
const port = process.env.PORT || 3000;

//リクエストの検証を行う場合。環境変数APPLICATION_ID(値はClova Developer Center上で入力したExtension ID)が必須
const clovaMiddleware = clova.Middleware({applicationId: process.env.EXTENSION_ID});
app.post('/clova', clovaMiddleware, clovaSkillHandler);

app.listen(port, () => console.log(`Server running on ${port}`));