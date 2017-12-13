# google-photos-retriever
Downloads photos from Google Photos (Picasa)/Google Drive

## Prerequisite
Need to enable Drive API for a Google Account and register a Client Application at [console.google.com](console.google.com)
### Turn on the Drive API
⋅⋅* Use this [wizard](https://console.developers.google.com/start/api?id=drive) to create or select a project in the Google Developers Console and automatically turn on the API. Click Continue, then Go to credentials.
⋅⋅* On the Add credentials to your project page, click the Cancel button.
⋅⋅* At the top of the page, select the OAuth consent screen tab. Select an Email address, enter a Product name if not already set, and click the Save button.
⋅⋅* Select the Credentials tab, click the Create credentials button and select OAuth client ID.
⋅⋅* Select the application type Other, enter the name "Drive API Quickstart", and click the Create button.
⋅⋅* Click OK to dismiss the resulting dialog.
⋅⋅* Click the(Download JSON) button to the right of the client ID.
⋅⋅* Move this file to your working directory and rename it client_secret.json.

## Setup
```shell
npm install googleapis --save
npm install google-auth-library --save
```

## Run
```shell
node photos-retriever.js
```

## Reference
[NodeJS Google Drive REST](https://developers.google.com/drive/v3/web/quickstart/nodejs)
