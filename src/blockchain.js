/**
 *                          Blockchain Class
 *  The Blockchain class contain the basics functions to create private blockchain
 *  It uses libraries like `crypto-js` to create the hashes for each block and `bitcoinjs-message` 
 *  to verify a message signature. The chain is stored in the array `this.chain = [];`.
 * 
 */

const SHA256 = require('crypto-js/sha256');
const hex2ascii = require('hex2ascii');
const BlockClass = require('./block.js');
const bitcoinMessage = require('bitcoinjs-message');

class Blockchain {

    /**
     * The methods in this class will always return a Promise to allow client applications or
     * other backends to call asynchronous functions.
     */
    constructor() {
        this.chain = [];
        this.height = -1;
        this.initializeChain();
    }

    /**
     * This method will check for the height of the chain and if there isn't a Genesis Block it will create it.
     */
    async initializeChain() {
        if (this.height === -1) {
            let block = new BlockClass.Block({ data: 'Genesis Block' });
            await this._addBlock(block);
        }
    }

    /**
     * Utility method that return a Promise that will resolve with the height of the chain
     */
    getChainHeight() {
        return new Promise((resolve, reject) => {
            resolve(this.height);
        });
    }

    /**
     * _addBlock(block) will store a block in the chain
     * @param {*} block 
     * The method will return a Promise that will resolve with the block added
     * or reject if an error happen during the execution.
     * Note: the symbol `_` in the method name indicates in the javascript convention 
     * that this method is a private method. 
     */
    _addBlock(block) {
        let self = this;
        return new Promise(async (resolve, reject) => {
            block.height = self.chain.length;
            block.time = new Date().getTime().toString().slice(0, -3);
            block.previousBlockHash = self.chain[self.chain.length - 1] ? self.chain[self.chain.length - 1].hash : null;
            block.hash = await SHA256(JSON.stringify(block)).toString();

            block.hash && (block.hash.length === 64) && (block.height === self.chain.length) && block.time ? resolve(block) : reject(new Error('Cannot add invalid block.'));
        })
        .catch(error => console.log('[ERROR] ', error)) 
        .then(block => {
            this.chain.push(block);
            this.height = this.chain.length - 1;
            return block;
        });
    }
    /**
     * The requestMessageOwnershipVerification(address) method
     * allows  to request a message that will be used to
     * sign it with Bitcoin Wallet (Electrum or Bitcoin Core)
     * This is the first step before submiting the Block.
     * The method return a Promise that will resolve with the message to be signed
     * @param {*} address 
     */
    requestMessageOwnershipVerification(address) {
        return new Promise((resolve) => {
            resolve(`${address}:${new Date().getTime().toString().slice(0,-3)}:starRegistry`);
        });
    }

    /**
     * The submitStar(address, message, signature, star) method
     * will allow users to register a new Block with the star object
     * into the chain. This method will resolve with the Block added or
     * reject with an error.
     * @param {*} address 
     * @param {*} message 
     * @param {*} signature 
     * @param {*} star 
     */
    submitStar(address, message, signature, star) {
        let self = this;
        return new Promise(async (resolve, reject) => {
            let messtime=parseInt(message.split(':')[1]);
            let currtime=parseInt(new Date().getTime().toString().slice(0, -3));
            if((currtime - messtime)>=(5*60)) reject(new Error("Too wide time stamp"));
            if(!bitcoinMessage.verify(message, address, signature)) reject(new Error("Unverifiable Identity"));
            let block=new BlockClass.Block({ owner: address, star: star});
            //block.owner=address;
            let addblock=await this._addBlock(block);
            resolve(addblock);
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block
     *  with the hash passed as a parameter.
     * Search on the chain array for the block that has the hash.
     * @param {*} hash 
     */
    getBlockByHash(hash) {
        let self = this;
        return new Promise((resolve, reject) => {
           let block=self.chain.filter(m => m.hash === hash)[0];
           if (block) {
            resolve(block);
        } else {
            resolve(null);
        }
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block object 
     * with the height equal to the parameter `height`
     * @param {*} height 
     */
    getBlockByHeight(height) {
        let self = this;
        return new Promise((resolve, reject) => {
            let block = self.chain.filter(p => p.height === height)[0];
            if (block) {
                resolve(block);
            } else {
                resolve(null);
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with an array of Stars objects existing in the chain 
     * and are belongs to the owner with the wallet address passed as parameter.
     * Remember the star should be returned decoded.
     * @param {*} address 
     */
    getStarsByWalletAddress(address) {
        let self = this;
        let stars = [];
        //this.validateChain().then(errors => typeof errors === 'string' ?  console.log('[SUCCESS] ', errors) : errors.forEach(error => console.log('[ERROR] ', error)));
        return new Promise((resolve, reject) => {
            self.chain.map(b => {
                b.getBData().then(data => {
                    if (data.owner === address) {
                        stars.push(data)
                    }
                });
            });
            resolve(stars)
           /* let mystars=self.chain.filter(block => block.address === address);
            if(mystars.length===0){reject(new Error("Invalid Address"))}
            stars=mystars.map(block => JSON.parse(hex2ascii(block.body)));
            stars ? resolve(stars) : reject(new Error("Stars Not found!"));
            */
        });
    }

    /**
     * This method will return a Promise that will resolve with the list of errors when validating the chain.
     * Steps to validate:
     */
    validateChain() {
        let self = this;
        let errorLog = [];
        return new Promise(async (resolve, reject) => {
            let prevhash=null;
            for (let block of self.chain){
                const verifyBlock= block.validate();
                if(!verifyBlock){
                    errorLog.push({block,error: "Unverified/Invalid Block!"});
                }
                    if(block.previousBlockHash!=prevhash){
                        errorLog.push(`Broken chain at ${block.height} with hash ${block.hash}`);
                    }
                prevhash=block.hash;
            }
            resolve(errorLog);
        });
    }
}

module.exports.Blockchain = Blockchain;   