/**
 * Deploy Credential Test Script
 */

const ftp = require('basic-ftp');
const path = require('path');

async function deploy() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: 'ftps2.50webs.com',
            user: 'ejaguiar1',
            password: '$a^FzN7BqKapSQMsZxD&^FeTJ',
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
