/** POST SSE client for /workflow/run; works in browsers and Node.js 20+. */
export async function runWorkflow({ baseUrl = '/api', token, clientId, uuid, inputs, sessionId, signal, onEvent = () => {} }) {
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/workflow/run`, {
    method: 'POST', signal,
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream', Authorization: `Bearer ${token}`, ClientID: clientId },
    body: JSON.stringify({ uuid, inputs, ...(sessionId == null ? {} : { sessionId }) }),
  });
  if (!response.ok || !response.headers.get('content-type')?.includes('text/event-stream')) {
    const body = await response.text();
    let message = body;
    try { message = JSON.parse(body).msg || body; } catch { /* Non-JSON proxy error. */ }
    throw new Error(`工作流请求失败 (${response.status}): ${message}`);
  }
  if (!response.body) throw new Error('浏览器未提供响应流');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      // Wait for a complete event, including across network chunks and UTF-8 bytes.
      let boundary;
      while ((boundary = /\r?\n\r?\n/.exec(buffer))) {
        const block = buffer.slice(0, boundary.index);
        buffer = buffer.slice(boundary.index + boundary[0].length);
        let event = 'message';
        const lines = [];
        for (const line of block.split(/\r?\n/)) {
          if (line.startsWith('event:')) event = line.slice(6).trim();
          if (line.startsWith('data:')) lines.push(line.slice(5).replace(/^ /, ''));
        }
        if (!lines.length) continue; // SSE comments/heartbeats.
        const raw = lines.join('\n');
        let data = raw;
        if (!event.startsWith('[NODE_CHUNK_')) {
          try { data = JSON.parse(raw); } catch { /* Error events can be plain text. */ }
        }
        onEvent({ event, data, raw });
        if (event === '[ERROR]') throw new Error(typeof data === 'string' ? data : data.msg || '流程执行失败');
        if (event === '[DONE]') return data;
      }
      if (done) throw new Error('连接结束，但未收到 [DONE]，请检查运行记录');
    }
  }
  finally {
    try { await reader.cancel(); } finally { reader.releaseLock(); }
  }
}
