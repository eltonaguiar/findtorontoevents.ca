/**
 * Deploy Credential Test Script
 */

const ftp = require('basic-ftp');
const path = require('path');

async function deploy() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: process.env.FTP_SERVER || 'ftps2.50webs.com',
            user: process.env.FTP_USER || 'ejaguiar1',
            password: process.env.FTP_PASS || '',
            secure: false
        });

        const local = path.join('E:/findtorontoevents_antigravity.ca/TORONTOEVENTS_ANTIGRAVITY', 'MOVIESHOWS/test-credentials.php');
        const remote = '/findtorontoevents.ca/MOVIESHOWS/test-credentials.php';

        console.log('Uploading test-credentials.php...');
        await client.uploadFrom(local, remote);
        console.log('Done! Visit: https://findtorontoevents.ca/MOVIESHOWS/test-credentials.php');

    } catch (error) {
        console.error('Failed:', error.message);
    } finally {
        client.close();
    }
}

deploy();
