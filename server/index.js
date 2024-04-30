const express = require('express');
const verifyProof = require('../utils/verifyProof');
const niceList = require('../utils/niceList');
const { keccak256 } = require('ethereum-cryptography/keccak');
const { bytesToHex } = require('ethereum-cryptography/utils');

const port = 1225;

const app = express();
app.use(express.json());

// TODO: hardcode a merkle root here representing the whole nice list
class MerkleTree {
  constructor(leaves) {
    this.leaves = leaves.map(Buffer.from).map(keccak256);
    this.concat = (left, right) => keccak256(Buffer.concat([left, right]));
  }

  getRoot() {
    return bytesToHex(this._getRoot(this.leaves));
  }

  getProof(index, layer = this.leaves, proof = []) {
    if (layer.length === 1) {
      return proof;
    }

    const newLayer = [];

    for (let i = 0; i < layer.length; i += 2) {
      const left = layer[i];
      const right = layer[i + 1];

      if (!right) {
        newLayer.push(left);
      } else {
        newLayer.push(this.concat(left, right));

        if (i === index || i === index - 1) {
          let isLeft = !(index % 2);
          proof.push({
            data: isLeft ? bytesToHex(right) : bytesToHex(left),
            left: !isLeft,
          });
        }
      }
    }

    return this.getProof(
      Math.floor(index / 2),
      newLayer,
      proof
    );
  }

  // private function
  _getRoot(leaves = this.leaves) {
    if (leaves.length === 1) {
      return leaves[0];
    }

    const layer = [];

    for (let i = 0; i < leaves.length; i += 2) {
      const left = leaves[i];
      const right = leaves[i + 1];

      if (right) {
        layer.push(this.concat(left, right));
      } else {
        layer.push(left);
      }
    }

    return this._getRoot(layer);
  }
}

// paste the hex string in here, without the 0x prefix
const MERKLE_ROOT = new MerkleTree(niceList);


app.post('/gift', (req, res) => {
  // grab the parameters from the front-end here
  const body = req.body;
  const name = body.name;

  // TODO: prove that a name is in the list 
  let isInTheList = false;

  const root = MERKLE_ROOT.getRoot();

  const index = niceList.findIndex(n => n === name);
  const proof = MERKLE_ROOT.getProof(index);
  
  isInTheList = verifyProof(proof, name, root);

  if(isInTheList) {
    res.send("You got a toy robot!");
  }
  else {
    res.send("You are not on the list :(");
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});
