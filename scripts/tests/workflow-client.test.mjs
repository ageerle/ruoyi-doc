import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import { runWorkflow } from '../../docs/public/files/workflow-client.mjs';

async function withServer(handler, callback) {
  const server = createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try { await callback(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise(resolve => server.close(resolve)); }
}
const options = { token: 'test-token', clientId: 'test-client', uuid: 'example', inputs: [] };

test('POST SSE handles byte-by-byte UTF-8, CRLF, multiple data lines and final output', async () => {
  await withServer((req, res) => {
    assert.equal(req.method, 'POST');
    assert.equal(req.url, '/workflow/run');
    assert.equal(req.headers.clientid, 'test-client');
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
    const content = ': heartbeat\r\n\r\nevent: [NODE_CHUNK_n]\r\ndata: 第一行\r\ndata: 第二行\r\n\r\nevent: [DONE]\r\ndata: {"output":{"value":"检查完成"}}\r\n\r\n';
    for (const byte of Buffer.from(content)) res.write(Buffer.from([byte]));
    res.end();
  }, async baseUrl => {
    const events = [];
    const result = await runWorkflow({ ...options, baseUrl, onEvent: event => events.push(event) });
    assert.equal(result.output.value, '检查完成');
    assert.equal(events[0].raw, '第一行\n第二行');
    assert.equal(events.length, 2);
  });
});

test('business errors and truncated streams never report success', async () => {
  for (const [body, error] of [['event: [ERROR]\ndata: 必填参数缺失\n\n', /必填参数缺失/], ['event: [START]\ndata: {}\n\n', /未收到/]]) {
    await withServer((_req, res) => { res.writeHead(200, { 'Content-Type': 'text/event-stream' }); res.end(body); }, async baseUrl => {
      await assert.rejects(runWorkflow({ ...options, baseUrl }), error);
    });
  }
});

test('HTTP-200 authentication failure is not mistaken for SSE', async () => {
  await withServer((_req, res) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{"code":401,"msg":"请重新登录"}'); }, async baseUrl => {
    await assert.rejects(runWorkflow({ ...options, baseUrl }), /请重新登录/);
  });
});

test('caller can abort an open stream without an automatic retry', async () => {
  await withServer((_req, res) => { res.writeHead(200, { 'Content-Type': 'text/event-stream' }); res.write('event: [START]\ndata: {}\n\n'); }, async baseUrl => {
    const controller = new AbortController();
    await assert.rejects(runWorkflow({ ...options, baseUrl, signal: controller.signal, onEvent: () => controller.abort() }), { name: 'AbortError' });
  });
});
