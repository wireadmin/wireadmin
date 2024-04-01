export const IPV4_REGEX = new RegExp(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);

/**
 * Private IP Address Identifier in Regular Expression
 *
 * 127.  0.0.0 – 127.255.255.255     127.0.0.0 /8
 *  10.  0.0.0 –  10.255.255.255      10.0.0.0 /8
 * 172. 16.0.0 – 172. 31.255.255    172.16.0.0 /12
 * 192.168.0.0 – 192.168.255.255   192.168.0.0 /16
 */
export function isPrivateIP(ip: string) {
  const ipRegex = /^(127\.)|(10\.)|(172\.1[6-9]\.)|(172\.2[0-9]\.)|(172\.3[0-1]\.)|(192\.168\.)/;
  return ipRegex.test(ip);
}
