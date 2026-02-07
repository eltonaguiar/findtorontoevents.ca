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
        await client.uploadFrom(path.join(__dirname, 'populate-comprehensive.php'), 'populate-comprehensive.php');
        console.log('✅ populate-comprehensive.php uploaded!');
        console.log('🌐 Run: https://findtorontoevents.ca/MOVIESHOWS3/populate-comprehensive.php');
        console.log('\n⚠️  This will take 10-15 minutes to complete!');

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        client.close();
    }
}

deploy();
