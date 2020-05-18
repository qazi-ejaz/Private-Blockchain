/**
 *                          Block class
 *  The Block class is a main component into any Blockchain platform, 
 *  it will store the data and act as a dataset for your application.
 *  The class will expose a method to validate the data... The body of
 *  the block will contain an Object that contain the data to be stored,
 *  the data should be stored encoded.
 */

const SHA256 = require('crypto-js/sha256');
const hex2ascii = require('hex2ascii');

class Block {

    // Constructor - argument data will be the object containing the transaction data
	constructor(data){
        //let star=data.star;
        //data = star ? { ...data, star } : data;
 		this.hash = null;                                           // Hash of the block
		this.height = 0;                                            // Block Height (consecutive number of each block)
		this.body = Buffer(JSON.stringify(data)).toString('hex');   // Will contain the transactions stored in the block, by default it will encode the data
		this.time = 0;                                              // Timestamp for the Block creation
		this.previousBlockHash = null;                              // Reference to the previous Block Hash
    }
    
    /**
     *  validate() method will validate if the block has been tampered or not.
     *  Been tampered means that someone from outside the application tried to change
     *  values in the block data as a consecuence the hash of the block should be different.
     */
    validate() {
        let self = this;
        return new Promise( (resolve, reject) => {
            const checkhash=self.hash;
            //self.hash=null;
            let newhash= SHA256(JSON.stringify(self)).toString();
            /*self.hash = await SHA256(JSON.stringify({...self, checkhash: null })).toString();*/
            resolve(checkhash === newhash);

        });
    }

    /**
     *  Auxiliary Method to return the block body (decoding the data)
     */
    getBData() {
        let self=this;
        return new Promise ((resolve,reject) => {
        if(self.height===0) {
            reject("Genesis Block Detected");
        } else {
            resolve(JSON.parse(hex2ascii(self.body)));
        }
    });
        // Getting the encoded data saved in the Block
        // Decoding the data to retrieve the JSON representation of the object

    }
}

module.exports.Block = Block;                    // Exposing the Block class as a module