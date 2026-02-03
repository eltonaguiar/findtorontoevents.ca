const fs = require('fs');

// Read the API response
const json = fs.readFileSync('e:/findtorontoevents_antigravity.ca/api_response.json', 'utf8');

console.log('Raw JSON length:', json.length);

try {
    const data = JSON.parse(json);
    console.log('Node.js parsed successfully');
    console.log('Creator count:', data.creators.length);

    console.log('\nLast 3 creators:');
    data.creators.slice(-3).forEach((c, i) => {
        console.log(`${data.creators.length - 2 + i}. ${c.name} (id: ${c.id})`);
    });

    const brunitarte = data.creators.find(c => c.name === 'Brunitarte');
    console.log('\nBrunitarte found:', !!brunitarte);
    if (brunitarte) {
        console.log('Brunitarte data:', JSON.stringify(brunitarte, null, 2));
    }
} catch (e) {
    console.error('Parse error:', e.message);
}
