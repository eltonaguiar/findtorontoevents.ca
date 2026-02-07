/**
 * UPDATE #37: Add source column to existing movies table
 */

const ftp = require('basic-ftp');
const path = require('path');

async function updateSchema() {
    const client = new ftp.Client();

    try {
        await client.access({
            host: process.env.FTP_SERVER || 'ftps2.50webs.com',
            user: process.env.FTP_USER || 'ejaguiar1',
            password: process.env.FTP_PASS || '',
            secure: false
        });

        console.log('📤 Uploading updated schema...');
        await client.uploadFrom(
            'E:/findtorontoevents_antigravity.ca/TORONTOEVENTS_ANTIGRAVITY/database/schema.sql',
            '/findtorontoevents.ca/MOVIESHOWS/database/schema.sql'
        );

        console.log('✅ Schema uploaded!');
        console.log('\nNow run: https://findtorontoevents.ca/MOVIESHOWS/init-database.php');
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        client.close();
    }
}

updateSchema();
