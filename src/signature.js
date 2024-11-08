const { ec, hash, num, json, Contract, WeierstrassSignatureType , encode} = require ('starknet');

const privateKey = "0x03449dc0ea11ff93b9f8095a88cc6400d81df63578fb9287323368c0ca3abfe0";
const starknetPublicKey = ec.starkCurve.getStarkKey(privateKey);
const fullPublicKey = encode.addHexPrefix(
  encode.buf2hex(ec.starkCurve.getPublicKey(privateKey, false))
);

const signature = ec.starkCurve.sign("0x0712eb9de1a6f124a4d04c4eee4ebb6abc476c651bb6a0fd560ee6bbfda13ebf", privateKey);

console.log(signature)
console.log(ec.starkCurve.getPublicKey(privateKey, false))