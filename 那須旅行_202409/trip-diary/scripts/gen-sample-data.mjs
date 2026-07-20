import CryptoJS from "crypto-js";
import fs from "node:fs";

const tripData = {
  tripTitle: "那須旅行 2024",
  heroImage: "images/demo-1.jpg",
  generatedAt: new Date().toISOString(),
  events: [
    {
      id: "sample-1",
      title: "手打ちそば 柏屋",
      dateISO: "2024-09-14T10:30:00.000+09:00",
      hasTime: true,
      memo: "現地集合。天気は晴れ。",
      shopUrl: "https://tabelog.com/tochigi/A0904/A090401/9000001/",
      comments: [
        { name: "修", text: "そばのコシが最高だった", photos: [] },
        { name: "美", text: "薬味が美味しかった", photos: [] },
      ],
      photos: ["images/demo-1.jpg", "images/demo-2.jpg"],
      coords: null,
    },
    {
      id: "sample-2",
      title: "牧場でランチ",
      dateISO: "2024-09-14T12:00:00.000+09:00",
      hasTime: true,
      memo: "ソフトクリームが美味しかった",
      comments: [],
      photos: ["images/demo-3.jpg"],
      coords: null,
    },
    {
      id: "sample-3",
      title: "那須どうぶつ王国",
      dateISO: "2024-09-15T09:30:00.000+09:00",
      hasTime: true,
      memo: "カピバラに癒された",
      comments: [{ name: "悠", text: "モルモット抱っこできた！", photos: [] }],
      photos: [],
      coords: null,
    },
  ],
  overallComments: [
    { name: "悠", text: "また来年も行きたい！", photos: [] },
    { name: "紗", text: "カピバラがかわいかった", photos: ["images/demo-2.jpg"] },
    { name: "修", text: "", photos: ["images/demo-3.jpg", "images/demo-1.jpg"] },
  ],
};

const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(tripData), "test1234").toString();
fs.writeFileSync("public/data.json", JSON.stringify({ ciphertext }), "utf-8");
console.log("wrote public/data.json with password: test1234");
