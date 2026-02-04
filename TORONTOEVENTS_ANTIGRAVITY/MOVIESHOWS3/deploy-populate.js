const ftp = require('basic-ftp');
const path = require('path');

async function deploy() {
    const client = new ftp.Client();
    client.ftp.verbose = true;

    try {
        console.log('🚀 Uploading populate-movies.php...\n');

        await client.access({
            host: 'ftps2.50webs.com',
            user: 'ejaguiar1',
            password: '$a^FzN7BqKapSQMsZxD&^FeTJ',
            secure: false
        });

        await client.cd('/findtorontoevents.ca/MOVIESHOWS3');

        await client.uploadFrom(path.join(__dirname, 'populate-movies.php'), 'populate-movies.php');
        console.log('✅ populate-movies.php uploaded!\n');

        console.log('🌐 Run: https://findtorontoevents.ca/MOVIESHOWS3/populate-movies.php\n');

    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    } finally {
        client.close();
    }
}

deploy();
