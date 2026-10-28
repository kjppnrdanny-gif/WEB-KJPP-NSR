import fs from 'fs';

const content = fs.readFileSync('data/config/credentials.secrets.php', 'utf8');

// Check what keys are in credentials.secrets.php
console.log('Has crypto_secret_key:', content.includes('crypto_secret_key') || content.includes('server_secret'));
console.log('Has signer_vault:', content.includes('signer_vault'));
