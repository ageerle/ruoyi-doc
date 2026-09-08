/**
 * Create a new release checklist workflow through the existing API.
 * api(method, path, body?) must return the unwrapped response data.
 * No database IDs, model credentials or pre-existing workflow IDs are embedded.
 */
export async function createReleaseWorkflow(api) {
  const uid = () => crypto.randomUUID().replaceAll('-', '');
  const components = await api('GET', '/workflow/public/component/list');
  const componentId = (name) => {
    const component = components.find(item => item.name === name);
    if (!component) throw new Error(`请先启用 ${name} 节点`);
    return component.id;
  };
  const ids = { Start: componentId('Start'), Switcher: componentId('Switcher'), End: componentId('End') };
  const workflow = await api('POST', '/workflow/add', {
    title: '北辰项目 · 发布检查助手',
    remark: '填写环境和版本，输入本次变更，生成对应的发布检查清单。仅生成清单，不执行部署。',
    isPublic: false,
  });
  const start = workflow.nodes.find(node => String(node.workflowComponentId) === String(ids.Start));
  if (!start) throw new Error('创建后未找到开始节点');
  const switchUuid = uid();
  const prodUuid = uid();
  const testUuid = uid();
  const caseUuid = uid();
  const input = (name, title) => ({ uuid: uid(), name, title, type: 1, required: true });
  const ref = (name, field) => ({ name, node_uuid: start.uuid, node_param_name: field });
  const refs = [{ name: 'question', node_uuid: switchUuid, node_param_name: 'output' }, ref('environment', 'environment'), ref('version', 'version')];
  const end = (uuid, title, y, result) => ({
    uuid, workflowComponentId: ids.End, title, positionX: 760, positionY: y,
    inputConfig: { user_inputs: [], ref_inputs: refs.map(item => ({ ...item })) },
    nodeConfig: { result },
  });
  const nodes = [
    { ...start, positionX: 80, positionY: 220,
      inputConfig: { ref_inputs: [], user_inputs: [input('question', '本次变更'), input('environment', '发布环境'), input('version', '发布版本')] },
      nodeConfig: { prologue: '' } },
    { uuid: switchUuid, workflowComponentId: ids.Switcher, title: '判断发布环境', positionX: 420, positionY: 220,
      inputConfig: { user_inputs: [], ref_inputs: [ref('environment', 'environment')] },
      nodeConfig: { cases: [{ uuid: caseUuid, operator: 'and', conditions: [{ uuid: uid(), node_uuid: start.uuid, node_param_name: 'environment', operator: '=', value: 'prod' }], target_node_uuid: prodUuid }], default_target_node_uuid: testUuid } },
    end(prodUuid, '生产发布清单', 70, '# 北辰项目 · 生产发布检查单\n\n- 发布环境：{environment}\n- 发布版本：{version}\n- 本次变更：{question}\n\n1. 发布前确认数据库备份与回滚版本。\n2. 联系发布负责人林小满，确认维护窗口。\n3. 检查后端 6039 端口与健康检查结果。\n4. 发布后验证登录、对话和知识检索。\n5. 记录验证结果，再通知业务方。\n\n> 此流程只生成检查单，审批与部署由现有发布制度执行。'),
    end(testUuid, '常规验证清单', 400, '# 北辰项目 · 常规验证检查单\n\n- 发布环境：{environment}\n- 发布版本：{version}\n- 本次变更：{question}\n\n1. 确认这是非生产环境；生产发布请将环境填写为 prod。\n2. 检查后端 6039 端口与健康检查结果。\n3. 回归本次变更，并保存测试记录。\n4. 验证通过后，再准备生产发布检查单。\n\n> 示例项目资料用于教程演练，此流程不会执行部署。'),
  ];
  const edge = (sourceNodeUuid, targetNodeUuid, sourceHandle = '') => ({ uuid: uid(), sourceNodeUuid, targetNodeUuid, sourceHandle, isNew: true });
  await api('POST', '/workflow/update', {
    uuid: workflow.uuid, nodes,
    edges: [edge(start.uuid, switchUuid), edge(switchUuid, prodUuid, caseUuid), edge(switchUuid, testUuid, 'default')],
    deleteNodes: [], deleteEdges: [],
  });
  return { uuid: workflow.uuid, title: workflow.title, startUuid: start.uuid, switchUuid, prodUuid, testUuid };
}
