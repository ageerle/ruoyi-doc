-- RuoYi AI：启用后端与前端均已实现、但基线 ruoyi-ai.sql 未初始化的 AI Flow 节点。
-- 执行前请备份数据库，并确认当前分支仍包含对应节点实现。
-- 不要添加 Dalle3 / FaqExtractor：当前 WfNodeFactory 没有它们的执行实现。

UPDATE `t_workflow_component`
SET `is_enable` = 1, `update_time` = CURRENT_TIMESTAMP
WHERE `name` = 'KnowledgeRetrieval' AND `is_deleted` = 0;

INSERT INTO `t_workflow_component`
    (`uuid`, `name`, `title`, `remark`, `display_order`, `is_enable`, `is_deleted`, `tenant_id`)
SELECT REPLACE(UUID(), '-', ''), 'KnowledgeRetrieval', '知识检索',
       '从已配置的知识库检索相关片段', 20, 1, 0, '000000'
WHERE NOT EXISTS (
    SELECT 1 FROM `t_workflow_component`
    WHERE `name` = 'KnowledgeRetrieval' AND `is_deleted` = 0
);

UPDATE `t_workflow_component`
SET `is_enable` = 1, `update_time` = CURRENT_TIMESTAMP
WHERE `name` = 'Tongyiwanx' AND `is_deleted` = 0;

INSERT INTO `t_workflow_component`
    (`uuid`, `name`, `title`, `remark`, `display_order`, `is_enable`, `is_deleted`, `tenant_id`)
SELECT REPLACE(UUID(), '-', ''), 'Tongyiwanx', '通义万相',
       '调用通义万相生成图片', 30, 1, 0, '000000'
WHERE NOT EXISTS (
    SELECT 1 FROM `t_workflow_component`
    WHERE `name` = 'Tongyiwanx' AND `is_deleted` = 0
);

UPDATE `t_workflow_component`
SET `is_enable` = 1, `update_time` = CURRENT_TIMESTAMP
WHERE `name` = 'MailSend' AND `is_deleted` = 0;

INSERT INTO `t_workflow_component`
    (`uuid`, `name`, `title`, `remark`, `display_order`, `is_enable`, `is_deleted`, `tenant_id`)
SELECT REPLACE(UUID(), '-', ''), 'MailSend', '邮件发送',
       '通过 SMTP 发送邮件', 50, 1, 0, '000000'
WHERE NOT EXISTS (
    SELECT 1 FROM `t_workflow_component`
    WHERE `name` = 'MailSend' AND `is_deleted` = 0
);

UPDATE `t_workflow_component`
SET `is_enable` = 1, `update_time` = CURRENT_TIMESTAMP
WHERE `name` = 'HttpRequest' AND `is_deleted` = 0;

INSERT INTO `t_workflow_component`
    (`uuid`, `name`, `title`, `remark`, `display_order`, `is_enable`, `is_deleted`, `tenant_id`)
SELECT REPLACE(UUID(), '-', ''), 'HttpRequest', 'HTTP 请求',
       '向外部 HTTP 服务发送请求', 60, 1, 0, '000000'
WHERE NOT EXISTS (
    SELECT 1 FROM `t_workflow_component`
    WHERE `name` = 'HttpRequest' AND `is_deleted` = 0
);

SELECT `id`, `name`, `title`, `is_enable`, `is_deleted`, `display_order`
FROM `t_workflow_component`
WHERE `name` IN ('KnowledgeRetrieval', 'Tongyiwanx', 'MailSend', 'HttpRequest')
ORDER BY `display_order`, `id`;
