import json
with open('streamer_check_results.json', 'r') as f:
    data = json.load(f)
    live_count = 0
    for result in data.get('results', []):
        if result.get('isLive'):
            print(f"LIVE: {result.get('creatorName')} on {result.get('platform')} - {result.get('status')}")
            live_count += 1
    print(f"\nTotal live creators: {live_count}")
