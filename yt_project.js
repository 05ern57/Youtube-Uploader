var fs = require("fs");
var readline = require("readline");
const assert = require("assert");
var { google } = require("googleapis");
var OAuth2 = google.auth.OAuth2;

//video category ID's for Youtube Video:
const categoryIds = {
  Entertainment: 24,
  Education: 27,
  ScienceTechnology: 28,
};

const credentials = require("./client_secret.json").web;
const scopes = ["https://www.googleapis.com/auth/youtube.upload"];
const TOKEN_PATH = "../" + "client_oauth_token.json";

const videoFilePath = `./deneme.mp4`;
const thumbFilePath = `./tumbnail.jpg`;

exports.uploadVideo = (title, description, tags) => {
  assert(fs.existsSync(videoFilePath));
  assert(fs.existsSync(thumbFilePath));

  //Load client secrets from a local file
  fs.readFile(
    "client_secret.json",
    function processClientSecrets(err, content) {
      if (err) {
        console.log("Error loading client secret file: " + err);
        return;
      }
      // Authorize a client with the loaded credentials, then call the YouTube API.
      authorize(JSON.parse(content), (auth) =>
        uploadVideo(auth, title, description, tags)
      );
    }
  );
};

function uploadVideo(auth, title, description, tags) {
  const service = google.youtube("v3");

  service.videos.insert(
    {
      auth: auth,
      part: "snippet,status",
      requestBody: {
        snippet: {
          title,
          description,
          tags,
          categoryId: categoryIds.Education,
          defaultLanguage: "tr",
          defaultAudioLanguage: "tr",
        },
        status: {
          privacyStatus: "private",
        },
      },
      media: {
        body: fs.createReadStream(videoFilePath),
      },
    },
    function (err, response) {
      if (err) {
        console.log("The API returned an error: " + err);
        return;
      }
      console.log(response.data);

      console.log("Video uploaded. Uploading the thumbnail now.");
      service.thumbnails.set(
        {
          auth: auth,
          videoId: response.data.id,
          media: {
            body: fs.createReadStream(videoFilePath),
          },
        },
        function (err, response) {
          if (err) {
            console.log("The API returned an error: " + err);
            return;
          }
          console.log(response.data);
        }
      );
    }
  );
}

function authorize(credentials, callback) {
  var clientSecret = credentials.web.client_secret;
  var clientId = credentials.web.client_id;
  var redirectUrl = credentials.web.redirect_uris[0];
  var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function (err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
  });
  console.log("Authorize this app by visiting this url: ", authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("Enter the code from that page here: ", function (code) {
    rl.close();
    oauth2Client.getToken(code, function (err, token) {
      if (err) {
        console.log("Error while trying to retrieve access token", err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != "EEXIST") {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
    if (err) throw err;
    console.log("Token stored to " + TOKEN_PATH);
  });
}

exports.uploadVideo("Başlık", "Açıklama", ["tag1", "tag2", "tag3"]);
