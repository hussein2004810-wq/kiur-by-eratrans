import assert from 'node:assert/strict';
import {imageDimensions,imageLimits} from '../worker/image-metadata.js';

const png=new Uint8Array(58);png.set([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0,0,0,13,0x49,0x48,0x44,0x52,0,0,2,128,0,0,1,224]);png.set([0,0,0,1,0x49,0x44,0x41,0x54,0,0,0,0,0,0,0,0,0,0x49,0x45,0x4e,0x44,0,0,0,0],33);
assert.deepEqual(imageDimensions('image/png',png),{width:640,height:480});

const jpeg=new Uint8Array(23);jpeg.set([0xff,0xd8,0xff,0xc0,0,17,8,1,224,2,128]);jpeg.set([0xff,0xd9],21);
assert.deepEqual(imageDimensions('image/jpeg',jpeg),{width:640,height:480});

const webp=new Uint8Array(30);webp.set([0x52,0x49,0x46,0x46,22,0,0,0,0x57,0x45,0x42,0x50,0x56,0x50,0x38,0x58,10,0,0,0,0,0,0,0,0x7f,2,0,0xdf,1]);
assert.deepEqual(imageDimensions('image/webp',webp),{width:640,height:480});
assert.equal(imageDimensions('image/png',png.slice(0,33)),null);
assert.deepEqual(imageLimits({MEDIA_MAX_DIMENSION:'999999',MEDIA_MAX_PIXELS:'bad',MEDIA_USER_QUOTA_BYTES:'1'}),{maxDimension:16384,maxPixels:20000000,userQuotaBytes:262144000,scopeQuotaBytes:2147483648});
console.log(JSON.stringify({ok:true,formats:['png','jpeg','webp'],malformedRejected:true,limitsBounded:true}));
