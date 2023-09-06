export const WG_PATH = '/etc/wireguard'

export const WG_PRE_UP = process.env.WG_PRE_UP || ''

export const WG_POST_UP = process.env.WG_POST_UP || ''

export const WG_PRE_DOWN = process.env.WG_PRE_DOWN || ''

export const WG_POST_DOWN = process.env.WG_POST_DOWN || ''

export const IPV4_REGEX = new RegExp(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)
