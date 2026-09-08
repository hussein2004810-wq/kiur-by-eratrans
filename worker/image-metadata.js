function text(bytes,offset,length){return String.fromCharCode(...bytes.slice(offset,offset+length))}
function be16(bytes,offset){return (bytes[offset]<<8)|bytes[offset+1]}
function be32(bytes,offset){return (bytes[offset]*0x1000000)+(bytes[offset+1]<<16)+(bytes[offset+2]<<8)+bytes[offset+3]}
function le24(bytes,offset){return bytes[offset]|(bytes[offset+1]<<8)|(bytes[offset+2]<<16)}
function le32(bytes,offset){return (bytes[offset]|(bytes[offset+1]<<8)|(bytes[offset+2]<<16)|(bytes[offset+3]<<24))>>>0}

function png(bytes){
  if(bytes.length<58)return null;let offset=8,dimensions=null,hasImageData=false,chunks=0;
  while(offset+12<=bytes.length&&chunks++<4096){
    const length=be32(bytes,offset),kind=text(bytes,offset+4,4),data=offset+8,end=data+length;if(end+4>bytes.length)return null;
    if(chunks===1){if(kind!=='IHDR'||length!==13)return null;dimensions={width:be32(bytes,data),height:be32(bytes,data+4)}}else if(kind==='IHDR')return null;
    if(kind==='IDAT'&&length>0)hasImageData=true;offset=end+4;
    if(kind==='IEND')return length===0&&offset===bytes.length&&hasImageData?dimensions:null;
  }
  return null;
}

function jpeg(bytes){
  if(bytes.length<4||bytes[bytes.length-2]!==0xff||bytes[bytes.length-1]!==0xd9)return null;let offset=2;const scanLimit=Math.min(bytes.length,65536);const sof=new Set([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf]);
  while(offset+3<scanLimit){
    if(bytes[offset]!==0xff){offset++;continue}
    while(offset<scanLimit&&bytes[offset]===0xff)offset++;
    const marker=bytes[offset++];if(marker===0xd8||marker===0x01||(marker>=0xd0&&marker<=0xd7))continue;if(marker===0xd9||marker===0xda)return null;
    if(offset+1>=scanLimit)return null;const length=be16(bytes,offset);if(length<2||offset+length>bytes.length)return null;
    if(sof.has(marker)){if(length<7)return null;return {height:be16(bytes,offset+3),width:be16(bytes,offset+5)}}
    offset+=length;
  }
  return null;
}

function webp(bytes){
  if(bytes.length<20||le32(bytes,4)+8!==bytes.length)return null;let offset=12;const scanLimit=Math.min(bytes.length,65536);
  while(offset+8<=scanLimit){
    const kind=text(bytes,offset,4),size=le32(bytes,offset+4),data=offset+8;if(data+size>bytes.length)return null;
    if(kind==='VP8X'){if(size<10)return null;return {width:le24(bytes,data+4)+1,height:le24(bytes,data+7)+1}}
    if(kind==='VP8L'){if(size<5||bytes[data]!==0x2f)return null;const b1=bytes[data+1],b2=bytes[data+2],b3=bytes[data+3],b4=bytes[data+4];return {width:1+(b1|((b2&0x3f)<<8)),height:1+((b2>>6)|(b3<<2)|((b4&0x0f)<<10))}}
    if(kind==='VP8 '){if(size<10||bytes[data+3]!==0x9d||bytes[data+4]!==0x01||bytes[data+5]!==0x2a)return null;return {width:(bytes[data+6]|(bytes[data+7]<<8))&0x3fff,height:(bytes[data+8]|(bytes[data+9]<<8))&0x3fff}}
    offset=data+size+(size&1);
  }
  return null;
}

export function imageDimensions(type,input){
  const bytes=input instanceof Uint8Array?input:new Uint8Array(input);let dimensions=null;
  if(type==='image/png')dimensions=png(bytes);else if(type==='image/jpeg')dimensions=jpeg(bytes);else if(type==='image/webp')dimensions=webp(bytes);
  if(!dimensions||!Number.isSafeInteger(dimensions.width)||!Number.isSafeInteger(dimensions.height)||dimensions.width<1||dimensions.height<1)return null;
  return dimensions;
}

export function imageLimits(env={}){
  const bounded=(value,fallback,min,max)=>{const parsed=Number(value);return Number.isSafeInteger(parsed)&&parsed>=min?Math.min(parsed,max):fallback};
  return {
    maxDimension:bounded(env.MEDIA_MAX_DIMENSION,8192,512,16384),maxPixels:bounded(env.MEDIA_MAX_PIXELS,20000000,1000000,100000000),
    userQuotaBytes:bounded(env.MEDIA_USER_QUOTA_BYTES,250*1024*1024,5*1024*1024,10*1024*1024*1024),
    scopeQuotaBytes:bounded(env.MEDIA_SCOPE_QUOTA_BYTES,2*1024*1024*1024,5*1024*1024,20*1024*1024*1024)
  };
}
