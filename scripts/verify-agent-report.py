"""Verify the tutorial's synthetic aggregation and ECharts data, without a live DB/model.

SQLite is used only to check the fixture's INSERT/SELECT semantics. This does not
validate MySQL DDL, datasource credentials, Agent routing, or model execution.
"""
import json
from pathlib import Path
import re
import sqlite3

ROOT = Path(__file__).resolve().parents[1]
sql = (ROOT / 'docs/public/files/agent-report-demo.sql').read_text(encoding='utf-8')
guide = (ROOT / 'docs/guide/features/agent.md').read_text(encoding='utf-8')
insert = re.search(r'^INSERT INTO demo_agent_sales_order[\s\S]*?;', sql, re.MULTILINE)
query = re.search(r'^SELECT region,[\s\S]*?;', sql, re.MULTILINE)
assert insert and query, 'Demo INSERT or SELECT missing'
expected = [('华东', 4000, 3), ('华南', 2400, 2), ('华北', 2000, 2), ('西部', 1200, 2)]

with sqlite3.connect(':memory:') as db:
    db.execute('CREATE TABLE demo_agent_sales_order (id INTEGER PRIMARY KEY, paid_at TEXT, region TEXT, paid_amount NUMERIC, order_status TEXT)')
    db.executescript(insert.group())
    rows = db.execute(query.group()).fetchall()
    assert rows == expected, rows
    assert db.execute('SELECT COUNT(*) FROM demo_agent_sales_order').fetchone()[0] == 12
    assert sum(row[1] for row in rows) == 9600
    assert sum(row[2] for row in rows) == 9

chart_match = re.search(r'^```echarts\n([\s\S]*?)\n```$', guide, re.MULTILINE)
assert chart_match, 'Expected chart code block missing'
chart = json.loads(chart_match.group(1))
assert chart['xAxis']['data'] == [row[0] for row in expected]
assert chart['series'][0]['data'] == [row[1] for row in expected]
assert chart['yAxis']['name'] == '元'
print('PASS: 12 source orders; 4 groups; CNY 9600; 9 paid orders; chart matches query.')
print('Scope: deterministic fixture and chart data; no live MySQL or LLM execution.')
