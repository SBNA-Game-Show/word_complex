# Steps to Follow to Initialize database to store English Game Data server Side

## Step: 1

- replicate repository/schemas/WordHunt.js schema with the same sub schemas.
- rename the main schemas to desired names
- the sub schemas can be reused for both the schemas

## Step: 2

- create a global function in service layer **GIVEN A LANGUAGE RETURNS EITHER ENGLISH OR SANSKRIT REPOSITORY**
- While initializing wordhunt repository initialize both English and Sanskrit repository.
- For All functions at the repo layer must accept repository as one of the parameter to use the repository to perform CRUD operations.

## Step: 3

- configure initializeStroyInfo,registerGameData,retrievePlayerInfoByStory methods in the controller to accept language in the req.body.
- configure retrievePlayerInfoByStory methods in the controller to accept language in the req.query
- configure all methods in the service layer to language as parameter
- configure all methods in the service layer to pass the database as parameter while calling the repository layer functions.
- configure getAllGameInfo,initializeStoryInfo,registerGameData,retrievePlayerInfoByStory in the repository to take repository as parameter and perform CRUD operations on them.

# Steps to Follow to Initialize database to store English Game Data client Side

## Step:1

- open client/src/services/wordHuntService.js
- configure writeGameInformation, getPlayerInfo , writeStoryInformation by adding language as a parameter.

## Step:2

- open client/src/games/WordHunt/utils/GameServiceManager.js
- configure writeStoryInfo, writeGameInfo and retrievePlayerInfo to get the language from the game which is **this.game.LANGUAGE**
- rename writeStoryInfoOnlySA to appropriate name
- remove **this.manager.werifyLanguage() &&** this verifies and calls the backend if the player is signed in player only
- open GameManager.js
- edit the addGameData function by removing the language check **this.verifyPlayer() &&**

## step:3

- open Game.js from root folder
- rename the following function **this.serviceManger.WriteStoryInfoOnlySA() to the same function name as edited in the GameServiceManger.js**

## Step:4

- open client/src/games/WordHunt/pages
- open FindNoungGame.js
- uncomment lines 244 till 249 and 373-379
- delete lines 367- 372 and then 236-241
- open FindVerbGame.js
- uncomment lines 225-230 and 339-345
- delete lines 333-338 and then 218-223
- open FindAdjectiveGame.js
- uncomment lines 227-233 and 365-370
- delete lines 358-363 and then 221-226
