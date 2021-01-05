var http = require('http');

const originalStoreHeader = http.OutgoingMessage.prototype._storeHeader;
http.OutgoingMessage.prototype._storeHeader = function _storeHeader(firstLine, headers) {
  originalStoreHeader.bind(this)(firstLine, headers);
  const lines = this._header.split('\r\n');
  const command = lines.shift();
  const newHeader = this._header = lines.reduce((result, line) => {
    const [ key, value ] = line.split(/:(.+)/);
    if (key && value) {
      const words = key.split('-');
      const newKey = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-');
      const newLine = [newKey, value.trim()].join(': ');
      if(newKey === 'Host') {
        result.unshift(newLine);
      } else {
        result.push(newLine);
      }
    } else {
      result.push(line);
    }
    return result;
  }, []);
  newHeader.unshift(command);
  this._header = newHeader.join('\r\n');
};