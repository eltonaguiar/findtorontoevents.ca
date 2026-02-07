const ftp = require('basic-ftp');
const path = require('path');

async function deployRootHtaccess() {
    const client = new ftp.Client();
    client.ftp.verbose = true;

    try {
        console.log('🚀 Deploying root .htaccess for case-insensitive URL routing...\n');
        console.log('🔌 Connecting to FTP...');

        await client.access({
            host: process.env.FTP_SERVER || 'ftps2.50webs.com',
            user: process.env.FTP_USER || 'ejaguiar1',
            password: process.env.FTP_PASS || '',
            secure: false
        });

        console.log('✅ Connected!\n');

        // Navigate to root directory
        console.log('📁 Navigating to /findtorontoevents.ca/...');
        await client.cd('/findtorontoevents.ca');
        console.log('✅ In root directory!\n');

        // Upload server_htaccess as .htaccess (from parent directory)
        console.log('📤 Uploading server_htaccess as .htaccess...');
        const localPath = path.join(__dirname, '..', '..', 'server_htaccess');
        await client.uploadFrom(localPath, '.htaccess');
        console.log('✅ .htaccess uploaded to server root!\n');

        console.log('🎉 Deployment successful!');
        console.log('🌐 Test URLs:');
        console.log('   - https://findtorontoevents.ca/movieshows2/');
        console.log('   - https://findtorontoevents.ca/MOVIESHOWS2/');
        console.log('   - https://findtorontoevents.ca/movieshows3/');
        console.log('   - https://findtorontoevents.ca/MOVIESHOWS3/');
        console.log('\n✨ All URLs (both uppercase and lowercase) should now work!\n');

    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    } finally {
        client.close();
    }
}

deployRootHtaccess();
