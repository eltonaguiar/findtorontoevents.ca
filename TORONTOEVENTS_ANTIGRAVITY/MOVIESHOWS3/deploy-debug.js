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

        await client.cd('/findtorontoevents.ca/MOVIESHOWS3');
        await client.uploadFrom(path.join(__dirname, 'debug-types.php'), 'debug-types.php');
        console.log('✅ debug-types.php uploaded!');
        console.log('🌐 Check: https://findtorontoevents.ca/MOVIESHOWS3/debug-types.php');

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        client.close();
    }
}

deploy();
