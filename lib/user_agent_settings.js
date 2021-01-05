const HEADERS = {
  chrome: { 
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'accept-language': 'en-US,en;q=0.9', 
    'accept-encoding': 'gzip, deflate, br'
  },
  firefox: {
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'accept-language': 'en-US,en;q=0.5',
    'accept-encoding': 'gzip, deflate, br'
  }
};

const CIPHER_SUITES = {
  'chrome': [
    'TLS_AES_128_GCM_SHA256',
    'TLS_AES_256_GCM_SHA384',
    'TLS_CHACHA20_POLY1305_SHA256',
    'ECDHE-ECDSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-ECDSA-AES256-GCM-SHA384',
    'ECDHE-RSA-AES256-GCM-SHA384',
    'ECDHE-ECDSA-CHACHA20-POLY1305',
    'ECDHE-RSA-CHACHA20-POLY1305',
    'ECDHE-RSA-AES128-SHA',
    'ECDHE-RSA-AES256-SHA',
    'AES128-GCM-SHA256',
    'AES256-GCM-SHA384',
    'AES128-SHA',
    'AES256-SHA',
    'DES-CBC3-SHA'
  ],
  'firefox': [
    'TLS_AES_256_GCM_SHA384',
    'TLS_CHACHA20_POLY1305_SHA256',
    'TLS_AES_128_GCM_SHA256',
    'ECDHE-ECDSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-ECDSA-CHACHA20-POLY1305',
    'ECDHE-RSA-CHACHA20-POLY1305',
    'ECDHE-ECDSA-AES256-GCM-SHA384',
    'ECDHE-RSA-AES256-GCM-SHA384',
    'ECDHE-ECDSA-AES256-SHA',
    'ECDHE-ECDSA-AES128-SHA',
    'ECDHE-RSA-AES128-SHA',
    'ECDHE-RSA-AES256-SHA',
    'DHE-RSA-AES128-SHA',
    'DHE-RSA-AES256-SHA',
    'AES128-SHA',
    'AES256-SHA',
    'DES-CBC3-SHA'
  ]
};

module.exports = (userAgent) => {
  const match = userAgent.match(/(firefox|chrome)[/\s]([\d.]+)/i);
  if(!match) {
    throw 'Unsupported user agent: ' + userAgent;
  }

  const browser = match[1].toLowerCase();
  const cipherSuite = CIPHER_SUITES[browser];
  const headers = HEADERS[browser];
  headers['user-agent'] = userAgent;
  return {
    cipherSuite,
    headers
  };
};
