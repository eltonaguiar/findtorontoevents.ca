#!/usr/bin/env python3
"""
Signal Quality Checker (Production) — Measures signal-to-execution gap.

NOTE: This is the PRODUCTION version with DB connectivity. If signal_quality_checker.py
has been replaced with a simplified version, use this file instead.

Usage:
  python signal_quality_prod.py              # Full analysis from DB
  python signal_quality_prod.py --algo NAME  # Single algorithm
"""
import os
import sys
import json
import argparse
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

DB_HOST = os.getenv('DB_HOST', 'mysql.50webs.com')
DB_USER = os.getenv('DB_USER', 'ejaguiar1_stocks')
DB_PASS = os.getenv('DB_PASS', 'stocks')
DB_NAME = os.getenv('DB_NAME', 'ejaguiar1_stocks')

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')


def fetch_signal_trade_data(algo_filter=None):
    import mysql.connector
    conn = mysql.connector.connect(host=DB_HOST, user=DB_USER, password=DB_PASS, database=DB_NAME)
    cursor = conn.cursor(dictionary=True)
    query = """
        SELECT algorithm_name, asset_class,
               COUNT(*) as total_signals,
               SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_signals,
               SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired_signals,
               SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_signals,
               AVG(signal_strength) as avg_strength
        FROM lm_signals WHERE algorithm_name != ''
    """
    if algo_filter:
        query += f" AND algorithm_name = '{algo_filter}'"
    query += " GROUP BY algorithm_name, asset_class"
    cursor.execute(query)
    signal_stats = cursor.fetchall()

    query2 = """
        SELECT algorithm_name, asset_class,
               COUNT(*) as total_trades,
               SUM(CASE WHEN realized_pnl_usd > 0 THEN 1 ELSE 0 END) as winning_trades,
               SUM(CASE WHEN realized_pnl_usd <= 0 THEN 1 ELSE 0 END) as losing_trades,
               AVG(realized_pct) as avg_return_pct,
               SUM(realized_pnl_usd) as total_pnl
        FROM lm_trades WHERE status = 'closed' AND algorithm_name != ''
    """
    if algo_filter:
        query2 += f" AND algorithm_name = '{algo_filter}'"
    query2 += " GROUP BY algorithm_name, asset_class"
    cursor.execute(query2)
    trade_stats = cursor.fetchall()
    cursor.close()
    conn.close()
    return signal_stats, trade_stats


def analyze_quality_gap(signal_stats, trade_stats):
    trade_map = {}
    for t in trade_stats:
        trade_map[f"{t['algorithm_name']}|{t['asset_class']}"] = t

    results = []
    for s in signal_stats:
        key = f"{s['algorithm_name']}|{s['asset_class']}"
        t = trade_map.get(key, {})
        total_signals = int(s.get('total_signals', 0))
        expired = int(s.get('expired_signals', 0))
        total_trades = int(t.get('total_trades', 0))
        winning = int(t.get('winning_trades', 0))
        signal_quality = float(s.get('avg_strength', 0))
        execution_rate = (total_trades / total_signals * 100) if total_signals > 0 else 0
        trade_win_rate = (winning / total_trades * 100) if total_trades > 0 else 0
        timeout_rate = (expired / total_signals * 100) if total_signals > 0 else 0
        quality_gap = signal_quality - trade_win_rate

        if quality_gap < 10: grade = 'A'
        elif quality_gap < 25: grade = 'B'
        elif quality_gap < 50: grade = 'C'
        elif quality_gap < 75: grade = 'D'
        else: grade = 'F'

        results.append({
            'algorithm': s['algorithm_name'], 'asset_class': s['asset_class'],
            'total_signals': total_signals, 'total_trades': total_trades,
            'execution_rate_pct': round(execution_rate, 1),
            'signal_quality': round(signal_quality, 1),
            'trade_win_rate_pct': round(trade_win_rate, 1),
            'timeout_rate_pct': round(timeout_rate, 1),
            'quality_gap': round(quality_gap, 1),
            'avg_return_pct': round(float(t.get('avg_return_pct', 0)), 2),
            'total_pnl_usd': round(float(t.get('total_pnl', 0)), 2),
            'grade': grade,
        })
    results.sort(key=lambda x: x['quality_gap'])
    return results


def save_results(results):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    path = os.path.join(OUTPUT_DIR, 'signal_quality_gap.json')
    with open(path, 'w') as f:
        json.dump({
            'generated': datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S'),
            'analysis': results,
            'summary': {
                'total_algorithms': len(results),
                'avg_quality_gap': round(sum(r['quality_gap'] for r in results) / len(results), 1) if results else 0,
                'best_execution': results[0]['algorithm'] if results else None,
                'worst_execution': results[-1]['algorithm'] if results else None,
            }
        }, f, indent=2)
    return path


def main():
    parser = argparse.ArgumentParser(description='Signal Quality Checker (Production)')
    parser.add_argument('--algo', help='Filter by algorithm name')
    args = parser.parse_args()
    print("=== Signal Quality Gap Analyzer (Production) ===")
    signal_stats, trade_stats = fetch_signal_trade_data(args.algo)
    print(f"Found {len(signal_stats)} signal groups, {len(trade_stats)} trade groups")
    if not signal_stats:
        print("No signal data found.")
        return
    results = analyze_quality_gap(signal_stats, trade_stats)
    print(f"\n{'Algorithm':30s} | {'Asset':8s} | {'Signals':>7} | {'Trades':>6} | {'ExecR%':>6} | "
          f"{'SigQ':>5} | {'WR%':>5} | {'Gap':>5} | {'Grade':>5}")
    print("-" * 110)
    for r in results:
        print(f"{r['algorithm']:30s} | {r['asset_class']:8s} | {r['total_signals']:>7} | "
              f"{r['total_trades']:>6} | {r['execution_rate_pct']:>5.1f}% | "
              f"{r['signal_quality']:>5.1f} | {r['trade_win_rate_pct']:>4.1f}% | "
              f"{r['quality_gap']:>5.1f} | {r['grade']:>5}")
    path = save_results(results)
    print(f"\nSaved: {path}")


if __name__ == '__main__':
    main()
