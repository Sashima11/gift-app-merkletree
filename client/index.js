const axios = require('axios');
const niceList = require('../utils/niceList.json');
const MerkleTree = require('../utils/MerkleTree');
const readline = require("readline");

const serverUrl = 'http://localhost:1225';

async function main() {
  // TODO: how do we prove to the server we're on the nice list? 

  const answer = await askForName("What is your full name? ");
  
  const { data: gift } = await axios.post(`${serverUrl}/gift`, {
    // TODO: add request body parameters here!
    name: answer,
  });

  console.log(gift);
}

function askForName(query) {
  const userInput = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
  });

  return new Promise(resolve => userInput.question(query, ans => {
      userInput.close();
      resolve(ans);
  }))
}

main();