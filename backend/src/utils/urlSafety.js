import dns from 'dns/promises';

function parseIpv4(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(isNaN) || parts.some(p => p < 0 || p > 255)) {
    return null;
  }
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function isPrivateIpv4(ip) {
  const ipNum = parseIpv4(ip);
  if (ipNum === null) return false;

  // 127.0.0.0/8
  if ((ipNum & 0xFF000000) === 0x7F000000) return true;
  // 10.0.0.0/8
  if ((ipNum & 0xFF000000) === 0x0A000000) return true;
  // 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
  if ((ipNum & 0xFFF00000) === 0xAC100000) return true;
  // 192.168.0.0/16
  if ((ipNum & 0xFFFF0000) === 0xC0A80000) return true;
  // 169.254.0.0/16
  if ((ipNum & 0xFFFF0000) === 0xA9FE0000) return true;

  return false;
}

function parseIpv6(ip) {
  const cleanIp = ip.split('%')[0].trim().toLowerCase();

  // If it's a loopback shortcut like ::1
  if (cleanIp === '::1') {
    return [0, 0, 0, 0, 0, 0, 0, 1];
  }

  // Count colons
  const colons = cleanIp.split(':');
  if (colons.length < 3 || colons.length > 9) return null;

  // Handle double colon ::
  let blocks = [];
  if (cleanIp.includes('::')) {
    const parts = cleanIp.split('::');
    if (parts.length > 2) return null; // Only one :: allowed

    const left = parts[0] ? parts[0].split(':') : [];
    const right = parts[1] ? parts[1].split(':') : [];

    const missingCount = 8 - (left.length + right.length);
    if (missingCount < 0) return null;

    blocks = [...left, ...Array(missingCount).fill('0'), ...right];
  } else {
    blocks = colons;
  }

  if (blocks.length !== 8) return null;

  const result = [];
  for (const block of blocks) {
    if (block === '') {
      result.push(0);
    } else {
      const val = parseInt(block, 16);
      if (isNaN(val) || val < 0 || val > 65535) return null;
      result.push(val);
    }
  }
  return result;
}

function isPrivateIpv6(ip) {
  const cleanIp = ip.split('%')[0].trim().toLowerCase();
  if (cleanIp.startsWith('::ffff:') && cleanIp.includes('.')) {
    const ipv4Str = cleanIp.substring(7);
    return isPrivateIpv4(ipv4Str);
  }

  const blocks = parseIpv6(ip);
  if (!blocks) return false;

  // Check ::1 (loopback)
  const isLoopback = blocks.every((val, index) => {
    if (index === 7) return val === 1;
    return val === 0;
  });
  if (isLoopback) return true;

  // Check fc00::/7 (unique local address)
  if ((blocks[0] & 0xfe00) === 0xfc00) return true;

  // Check fe80::/10 (link-local unicast)
  if ((blocks[0] & 0xffc0) === 0xfe80) return true;

  return false;
}

export async function isUrlSafe(urlString) {
  try {
    const url = new URL(urlString);

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }

    const hostname = url.hostname;

    let lookupResults;
    try {
      lookupResults = await dns.lookup(hostname, { all: true });
    } catch {
      return false;
    }

    for (const res of lookupResults) {
      const ip = res.address;
      if (res.family === 4 || ip.includes('.')) {
        if (isPrivateIpv4(ip)) return false;
      } else if (res.family === 6 || ip.includes(':')) {
        if (isPrivateIpv6(ip)) return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}
