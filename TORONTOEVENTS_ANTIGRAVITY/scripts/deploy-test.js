/**
 * Deploy test-post.php
 */

const ftp = require('basic-ftp');

async function deployTest() {
    const client = new ftp.Client();

    try {
        await client.access({
            host: process.env.FTP_SERVER || 'ftps2.50webs.com',
            user: process.env.FTP_USER || 'ejaguiar1',
            password: process.env.FTP_PASS || '',
            secure: false
        });

        console.log('Uploading test-post.php...');
        await client.uploadFrom(
            'E:/findtorontoevents_antigravity.ca/TORONTOEVENTS_ANTIGRAVITY/MOVIESHOWS/test-post.php',
            '/findtorontoevents.ca/MOVIESHOWS/test-post.php'
        );

        console.log('✅ Deployed!');
        console.log('Test at: https://findtorontoevents.ca/MOVIESHOWS/test-post.php');
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        client.close();
    }
}

deployTest();
