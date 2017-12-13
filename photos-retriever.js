/**
* Retrieves photos from Google Photos(Picasa) via Google Drive REST API. 
*
**/

var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var os = require('os');
//var https = require('https');
//const { URL } = require('url');
//var uuidv4 = require('uuid/v4');
os.homedir() 

var FILES = [];
var RESULTS_PER_REQUEST = 1000;

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/drive-nodejs-photo-retriever.json
var SCOPES = ['https://www.googleapis.com/auth/drive.photos.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'drive-nodejs-photo-retriever.json';

// Load client secrets from a local file. It is expected to be at the root of homedir.
fs.readFile(os.homedir() + '/client_secret.json', function processClientSecrets(err, content) {
  if (err) {
    console.log('Error loading client secret file: ' + err);
    return;
  }
  // Authorize a client with the loaded credentials, then call the
  // Drive API.
  authorize(JSON.parse(content), {
    callback: listFiles,
    onComplete: downloadFiles
  });  
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callbackOptions) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callbackOptions.callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      if(callbackOptions && callbackOptions.callback) {
        callbackOptions.callback(oauth2Client, {
          onComplete : callbackOptions.onComplete
        });
      }
      
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

function downloadFiles(auth) {
  if(FILES.length > 0) {
    console.log("Downloading " + FILES.length + " files...")
    downloadFile(auth, FILES);          
  } else {
    console.log("Nothing to download.");
  }
}

function downloadFile(auth, FILES, index) {      
  console.log(".......");
  if(!index) {
    index = 0;
  }
  console.log("index: " + index);
  file = FILES[index];
  if(!file) {
    return;
  }

  var filename = file.id + "_" + file.title;
  if(fs.existsSync(filename)) {
    console.log("File Already exits: " + filename);
    downloadFile(auth, FILES, ++index); 
    return;
  }

  var downloadUrl = file.downloadUrl;  
  console.log("Dowloading... " + filename + " from " + downloadUrl);
  var fileId = file.id;
  var dest = fs.createWriteStream(filename);
  var service = google.drive('v2');
  service.files.get({
    auth: auth,
    fileId: fileId,
    alt: 'media'
  })
  .on('end', function () {
    console.log('Finished downloading: ' + filename);
    downloadFile(auth, FILES, ++index);
  })
  .on('error', function (err) {
    console.log('Error during download: ' + filename, err);
    downloadFile(auth, FILES, ++index);
  })
  .pipe(dest);

  // var downloadUrl = file.downloadUrl;  
  
  // console.log("Dowloading... " + filename + " from " + downloadUrl);
  // console.log("Using token: " + auth.credentials.access_token);  
  // var urlObject = new URL(downloadUrl);

  // var options = {
  //   headers: {
  //     'Authorization': 'Bearer ' + auth.credentials.access_token
  //   },
  //   hostname: urlObject.hostname,
  //   port: urlObject.port,
  //   path: urlObject.pathname + urlObject.search,
  //   method : 'GET'
  // };

  // var wstream = fs.createWriteStream(filename);
  // wstream.on('open', function(fd) {

  //   https.get(options, function(res) {
  //     res.setEncoding('binary');
      
  //     res.on('data', function(chunk){
  //         wstream.write(chunk);
  //     });

  //     res.on('end', function(){
  //         wstream.end();
  //         downloadFile(auth, FILES, ++index);        
  //     });    
  //   });    
  // });

  
}

/**
 * Lists the names and IDs of up to 10 files.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listFiles(auth, options) {

  var filter;
  var nextPageToken;
  if(options && options.nextPageToken) {
    nextPageToken = options.nextPageToken;
    filter = {
      auth: auth,
      'maxResults': RESULTS_PER_REQUEST,
      'pageToken': nextPageToken,
      'spaces': 'photos'
    };
  } else {
      filter = {
        auth: auth,
        'maxResults': RESULTS_PER_REQUEST,
        'spaces': 'photos'      
    };
  }

  var service = google.drive('v2');
  service.files.list(filter,
   function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }

    // const content = JSON.stringify(response);    
    // var responseJSON = "response_" + uuidv4() + ".json";
    // fs.writeFileSync(responseJSON, content, 'utf8', function (saveError) {
    //     if (saveError) {
    //         return console.log(saveError);
    //     }

    //     console.log("Response saved to disk: " + responseJSON);
    // });
    
    var files = response.items;
    var nextLink = response.nextLink;
    var nextPageToken = response.nextPageToken;    
    console.log("Retreived " + files.length + " files.");
    if (files && files.length > 0) {
      for (var i = 0; i < files.length; i++) {
        var file = files[i];        
        FILES.push(file);
      }
      if(nextPageToken) {
        listFiles(auth, {
          nextPageToken: nextPageToken,
          onComplete : options.onComplete
        });
      } else {
        console.log("Done.");
        if(options.onComplete) {
          options.onComplete(auth);   
        }
      }
    } else {
      console.log('Done.');
      if(options.onComplete) {
          options.onComplete(auth);   
        }
    }
  });  
}
