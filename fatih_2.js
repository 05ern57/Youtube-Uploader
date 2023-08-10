const { google } = require("googleapis");
const fs = require("fs");
const readline = require("readline");

// 'client_secret.json' dosyasını yükleyerek kimlik bilgilerini alalım
const credentials = require("./client_secret.json").installed;

// Gerekli kapsamları ve yetkilendirme türünü ayarlayalım
const scopes = ["https://www.googleapis.com/auth/youtube.upload"];
const auth = new google.auth.OAuth2(
  credentials.client_id,
  credentials.client_secret,
  credentials.redirect_uris[0]
);
const youtube = google.youtube({ version: "v3", auth });

// Yüklenecek video hakkındaki bilgileri doldurun
const videoDetails = {
  part: "snippet",
  requestBody: {
    snippet: {
      title: "Video Başlığı",
      description: "Video Açıklaması",
      tags: ["etiket1", "etiket2", "etiket3"], // İsteğe bağlı: Videonuz için etiketler ekleyin
      categoryId: "22", // YouTube Kategori Kimliği: https://developers.google.com/youtube/v3/docs/videoCategories/list
    },
    status: {
      privacyStatus: "private",
    },
  },
};

// Yüklenecek video dosyasının yolunu belirtin
const videoPath =
  "C:Users\x57DesktopEğitim DenemeleriAAA JAVASCRIPTJonas CourseYoutubedeneme.mp4";

// Konsoldan yetkilendirme kodunu almak için fonksiyon
async function getAuthCode() {
  // async olarak işaretlenmeli
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question("Lütfen yetkilendirme kodunu girin: ", (code) => {
      rl.close();
      resolve(code);
    });
  });
}

async function uploadVideo() {
  try {
    // Yetkilendirme işlemi yapalım
    const authUrl = auth.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
    });
    console.log("Yetkilendirme URL'si:", authUrl);

    // Yetkilendirme tamamlandıktan sonra gelen kodu alalım
    const authCode = await getAuthCode();
    auth.setCredentials({ access_token: authCode });

    // Video yüklemesi gerçekleştirelim
    const res = await youtube.videos.insert(videoDetails, {
      media: {
        body: fs.createReadStream(videoPath),
      },
    });

    console.log(
      "Yükleme tamamlandı! Video URL:",
      `https://youtu.be/${res.data.id}`
    );
  } catch (err) {
    console.error("Hata:", err.message);
  }
}

uploadVideo();
