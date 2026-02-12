#!/usr/bin/env python3
"""
Win Rate Statistical Significance Tester (Production) — Real vs luck determination.

NOTE: This is the PRODUCTION version with DB connectivity, Wilson CI, power analysis.
If winrate_significance.py has been replaced with a simplified version, use this.

Usage:
  python winrate_significance_prod.py              # Full analysis from DB
  python winrate_significance_prod.py --threshold 0.55   # Test against 55% baseline
"""
import os
import sys
import json
import argparse
import math
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

DB_HOST = os.getenv('DB_HOST', 'mysql.50webs.com')
DB_USER = os.getenv('DB_USER', 'ejaguiar1_stocks')
DB_PASS = os.getenv('DB_PASS', 'stocks')
DB_NAME = os.getenv('DB_NAME', 'ejaguiar1_stocks')

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')


def binomial_test_pvalue(successes, trials, null_prob=0.5):
    try:
        from scipy.stats import binom_test
        return binom_test(successes, trials, null_prob, alternative='greater')
    except ImportError:
        if trials < 5:
            return 1.0
        p_hat = successes / trials
        se = math.sqrt(null_prob * (1 - null_prob) / trials)
        if se == 0:
            return 1.0
        z = (p_hat - null_prob) / se
        return 0.5 * math.erfc(z / math.sqrt(2))


def min_trades_for_significance(win_rate, null_prob=0.5, alpha=0.05, power=0.8):
    if win_rate <= null_prob:
        return float('inf')
    z_alpha = 1.645
    z_beta = 0.842
    n = ((z_alpha + z_beta) ** 2 * null_prob * (1 - null_prob)) / ((win_rate - null_prob) ** 2)
    return int(math.ceil(n))


def fetch_algo_stats():
    import mysql.connector
    conn = mysql.connector.connect(host=DB_HOST, user=DB_USER, password=DB_PASS, database=DB_NAME)
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT algorithm_name, asset_class,
               COUNT(*) as total_trades,
               SUM(CASE WHEN realized_pnl_usd > 0 THEN 1 ELSE 0 END) as wins
        FROM lm_trades WHERE status = 'closed' AND algorithm_name != ''
        GROUP BY algorithm_name, asset_class
    """)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows


def analyze_significance(stats, null_prob=0.5):
    results = []
    for s in stats:
        total = int(s['total_trades'])
        wins = int(s['wins'])
        if total == 0:
            continue
        win_rate = wins / total
        p_value = binomial_test_pvalue(wins, total, null_prob)

        if p_value < 0.01:
            significance, stars = 'HIGHLY SIGNIFICANT', '***'
        elif p_value < 0.05:
            significance, stars = 'SIGNIFICANT', '**'
        elif p_value < 0.10:
            significance, stars = 'MARGINAL', '*'
        else:
            significance, stars = 'NOT SIGNIFICANT', ''

        if win_rate > null_prob:
            min_n = min_trades_for_significance(win_rate, null_prob)
            trades_remaining = max(0, min_n - total)
        else:
            min_n = None
            trades_remaining = None

        # Wilson score CI
        z = 1.96
        denom = 1 + z ** 2 / total
        centre = (win_rate + z ** 2 / (2 * total)) / denom
        spread = z * math.sqrt((win_rate * (1 - win_rate) + z ** 2 / (4 * total)) / total) / denom
        ci_lower = max(0, centre - spread)
        ci_upper = min(1, centre + spread)

        results.append({
            'algorithm': s['algorithm_name'], 'asset_class': s['asset_class'],
            'total_trades': total, 'wins': wins,
            'win_rate_pct': round(win_rate * 100, 2),
            'null_hypothesis_pct': round(null_prob * 100, 1),
            'p_value': round(p_value, 6), 'significance': significance, 'stars': stars,
            'ci_95_lower': round(ci_lower * 100, 1), 'ci_95_upper': round(ci_upper * 100, 1),
            'min_trades_needed': min_n, 'trades_remaining': trades_remaining,
        })
    results.sort(key=lambda x: x['p_value'])
    return results


def save_results(results, null_prob):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    path = os.path.join(OUTPUT_DIR, 'winrate_significance.json')
    sig_count = sum(1 for r in results if r['p_value'] < 0.05)
    with open(path, 'w') as f:
        json.dump({
            'generated': datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S'),
            'null_hypothesis': f'{null_prob*100:.0f}% random baseline',
            'total_algorithms': len(results), 'significant_at_5pct': sig_count,
            'results': results,
        }, f, indent=2)
    return path


def main():
    parser = argparse.ArgumentParser(description='Win Rate Significance Tester (Production)')
    parser.add_argument('--threshold', type=float, default=0.5)
    args = parser.parse_args()
    null_prob = args.threshold
    print(f"=== Win Rate Significance Test (H0: WR = {null_prob*100:.0f}%) ===")
    stats = fetch_algo_stats()
    print(f"Found {len(stats)} algorithm groups")
    if not stats:
        print("No trade data found.")
        return
    results = analyze_significance(stats, null_prob)
    print(f"\n{'Algorithm':30s} | {'Asset':8s} | {'N':>5} | {'Wins':>4} | {'WR%':>6} | "
          f"{'p-value':>8} | {'Sig':>5} | {'95% CI':>12} | {'Need':>5}")
    print("-" * 115)
    for r in results:
        ci = f"{r['ci_95_lower']:.0f}-{r['ci_95_upper']:.0f}%"
        need = str(r['trades_remaining']) if r['trades_remaining'] is not None else 'N/A'
        print(f"{r['algorithm']:30s} | {r['asset_class']:8s} | {r['total_trades']:>5} | "
              f"{r['wins']:>4} | {r['win_rate_pct']:>5.1f}% | "
              f"{r['p_value']:>8.4f} | {r['stars']:>5} | {ci:>12} | {need:>5}")
    sig_count = sum(1 for r in results if r['p_value'] < 0.05)
    print(f"\nStatistically significant (p<0.05): {sig_count}/{len(results)} algorithms")
    path = save_results(results, null_prob)
    print(f"Saved: {path}")


if __name__ == '__main__':
    main()
