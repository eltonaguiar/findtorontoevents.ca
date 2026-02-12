#!/usr/bin/env python3
"""
Kelly Optimizer (Production) — Recalculates optimal Kelly fractions from actual trade history.

NOTE: This is the PRODUCTION version with full DB connectivity, regime adjustment,
rolling 30-day comparison, and decay warnings. If kelly_optimizer.py has been replaced
with a simplified version, use this file instead.

Usage:
  python kelly_optimizer_prod.py              # Full recalculation
  python kelly_optimizer_prod.py --regime     # Include regime adjustment
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

MIN_POSITION_PCT = 1.0
MAX_POSITION_PCT = 10.0
KELLY_FRACTION = 0.25


def fetch_trades(lookback_days=None):
    import mysql.connector
    conn = mysql.connector.connect(host=DB_HOST, user=DB_USER, password=DB_PASS, database=DB_NAME)
    cursor = conn.cursor(dictionary=True)
    query = """
        SELECT algorithm_name, asset_class, symbol, realized_pnl_usd, realized_pct,
               position_value_usd, exit_date
        FROM lm_trades WHERE status = 'closed' AND algorithm_name != ''
    """
    if lookback_days:
        query += f" AND exit_date >= DATE_SUB(CURDATE(), INTERVAL {lookback_days} DAY)"
    cursor.execute(query)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows


def fetch_current_regime():
    import mysql.connector
    try:
        conn = mysql.connector.connect(host=DB_HOST, user=DB_USER, password=DB_PASS, database=DB_NAME)
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT hmm_regime, hmm_confidence FROM lm_market_regime ORDER BY date DESC LIMIT 1")
        row = cursor.fetchone()
        cursor.close()
        conn.close()
        return row if row else {'hmm_regime': 'sideways', 'hmm_confidence': 0.5}
    except Exception:
        return {'hmm_regime': 'sideways', 'hmm_confidence': 0.5}


def calculate_kelly(trades):
    groups = {}
    for t in trades:
        key = f"{t['algorithm_name']}|{t['asset_class']}"
        groups.setdefault(key, []).append(t)

    results = []
    for key, group_trades in groups.items():
        algo, asset = key.split('|')
        n = len(group_trades)
        if n < 3:
            continue
        wins = [t for t in group_trades if float(t.get('realized_pnl_usd', 0)) > 0]
        losses = [t for t in group_trades if float(t.get('realized_pnl_usd', 0)) <= 0]
        win_rate = len(wins) / n
        avg_win_pct = sum(float(t.get('realized_pct', 0)) for t in wins) / len(wins) if wins else 0
        avg_loss_pct = abs(sum(float(t.get('realized_pct', 0)) for t in losses) / len(losses)) if losses else 0.01
        if avg_loss_pct <= 0:
            avg_loss_pct = 0.01
        odds = avg_win_pct / avg_loss_pct
        raw_kelly = win_rate - (1 - win_rate) / odds if odds > 0 else 0
        safe_kelly = max(0, raw_kelly * KELLY_FRACTION)
        recommended_pct = max(MIN_POSITION_PCT, min(MAX_POSITION_PCT, safe_kelly * 100))
        results.append({
            'algorithm': algo, 'asset_class': asset, 'sample_size': n,
            'win_rate': round(win_rate * 100, 2),
            'avg_win_pct': round(avg_win_pct, 3), 'avg_loss_pct': round(avg_loss_pct, 3),
            'win_loss_ratio': round(odds, 3), 'raw_kelly': round(raw_kelly, 4),
            'quarter_kelly': round(safe_kelly, 4),
            'recommended_position_pct': round(recommended_pct, 2),
        })
    results.sort(key=lambda x: x['quarter_kelly'], reverse=True)
    return results


def apply_regime_adjustment(results, regime):
    regime_name = regime.get('hmm_regime', 'sideways')
    confidence = float(regime.get('hmm_confidence', 0.5))
    multipliers = {
        'bull': 1.0 + (confidence - 0.5) * 0.4,
        'sideways': 0.85,
        'bear': 0.6 - (confidence - 0.5) * 0.2,
    }
    mult = multipliers.get(regime_name, 0.85)
    for r in results:
        r['regime'] = regime_name
        r['regime_confidence'] = round(confidence, 3)
        r['regime_multiplier'] = round(mult, 3)
        adjusted = r['recommended_position_pct'] * mult
        r['regime_adjusted_pct'] = round(max(MIN_POSITION_PCT, min(MAX_POSITION_PCT, adjusted)), 2)
    return results


def save_results(results, regime=None):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    path = os.path.join(OUTPUT_DIR, 'kelly_optimized.json')
    output = {
        'generated': datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S'),
        'kelly_fraction_used': KELLY_FRACTION,
        'bounds': {'min_pct': MIN_POSITION_PCT, 'max_pct': MAX_POSITION_PCT},
        'total_algorithms': len(results), 'optimized_sizes': results,
    }
    if regime:
        output['current_regime'] = regime
    with open(path, 'w') as f:
        json.dump(output, f, indent=2)
    return path


def main():
    parser = argparse.ArgumentParser(description='Kelly Optimizer (Production)')
    parser.add_argument('--regime', action='store_true', help='Apply regime adjustment')
    args = parser.parse_args()
    print("=== Kelly Fraction Optimizer (Production) ===")
    all_trades = fetch_trades()
    print(f"Loaded {len(all_trades)} all-time closed trades")
    if not all_trades:
        print("No trades found.")
        return
    results = calculate_kelly(all_trades)

    # Rolling 30-day comparison
    recent_trades = fetch_trades(lookback_days=30)
    recent_results = calculate_kelly(recent_trades)
    recent_map = {f"{r['algorithm']}|{r['asset_class']}": r for r in recent_results}
    for r in results:
        key = f"{r['algorithm']}|{r['asset_class']}"
        recent = recent_map.get(key)
        if recent:
            r['rolling_30d_kelly'] = recent['quarter_kelly']
            r['rolling_30d_wr'] = recent['win_rate']
            r['decay_warning'] = r['win_rate'] > 0 and recent['win_rate'] < r['win_rate'] * 0.8
        else:
            r['rolling_30d_kelly'] = None
            r['rolling_30d_wr'] = None
            r['decay_warning'] = False

    regime = None
    if args.regime:
        regime = fetch_current_regime()
        print(f"Current regime: {regime.get('hmm_regime')} (confidence: {regime.get('hmm_confidence')})")
        results = apply_regime_adjustment(results, regime)

    print(f"\n{'Algorithm':30s} | {'Asset':8s} | {'N':>4} | {'WR%':>6} | {'W/L':>5} | {'RawK':>6} | {'1/4K':>6} | {'Rec%':>5}")
    print("-" * 100)
    for r in results:
        decay = " **DECAY**" if r.get('decay_warning') else ""
        regime_col = f" -> {r['regime_adjusted_pct']}%" if 'regime_adjusted_pct' in r else ""
        print(f"{r['algorithm']:30s} | {r['asset_class']:8s} | {r['sample_size']:>4} | "
              f"{r['win_rate']:>5.1f}% | {r['win_loss_ratio']:>5.2f} | "
              f"{r['raw_kelly']:>6.4f} | {r['quarter_kelly']:>6.4f} | "
              f"{r['recommended_position_pct']:>4.1f}%{regime_col}{decay}")

    path = save_results(results, regime)
    print(f"\nSaved: {path}")


if __name__ == '__main__':
    main()
