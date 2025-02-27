import * as selfsigned from 'selfsigned';
import * as fs from 'fs';
import * as path from 'path';

const attrs = [{ name: 'commonName', value: 'localhost' }];
const pems = selfsigned.generate(attrs, {
  algorithm: 'sha256',
  days: 365,
  keySize: 2048,
});

const certsDir = path.join(__dirname, '..', 'certs');

if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir);
}

fs.writeFileSync(path.join(certsDir, 'private-key.pem'), pems.private);
fs.writeFileSync(path.join(certsDir, 'public-cert.pem'), pems.cert);

console.log('✅ SSL certificates generated successfully!');
