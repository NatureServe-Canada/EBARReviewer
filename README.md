# EBAR Reviewer
ArcGIS JavaScript web app for reviewing EBAR maps

Project: Ecosytem-based Automated Range Mapping (EBAR)

Credits: Kevin Hibma, Max Guo, Randal Greene

Based on: https://github.com/allenanselmo/species-reviewer-naba and https://github.com/vannizhang/species-reviewer under Apache 2.0 (http://www.apache.org/licenses/)<br>
© NatureServe Canada 2020 under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)

From the project's root directory, install the required packages (dependencies):

```sh
npm install
```

## Running the app 
Now you can start the webpack dev server to test the app on your local machine:

```sh
# it will start a server instance and begin listening for connections from localhost on port 8080
npm run start
```

## Deployment
To build/deploye the app, you can simply run:

```sh
# it will place all files needed for deployment into the /dist directory 
npm run build
```