---
outline: deep
---

# Resource Management {#资源管理}

::: info RuoYi AI documentation
This guide covers [RuoYi AI](https://gitee.com/ageerle/ruoyi-ai). Report documentation problems through an [issue](https://gitee.com/ageerle/ruoyi-ai/issues).
:::

## Overview {#概览}

AI applications use uploaded files, links, data sources, knowledge attachments, generated media, skill outputs, and tool resources. These capabilities currently reside in OSS, knowledge attachments, conversation messages, media generation, and skill directories. This page proposes a unified resource center; it does not describe an existing resource-center screen.

## Resource types {#资源类型}

| Type | Examples | Related modules |
| --- | --- | --- |
| Files | Uploaded documents and generated Word, Excel, or PDF files | Knowledge, skills, conversations |
| Media | Images, audio, video | Multimodal services |
| Knowledge attachments | Original documents and chunks | Knowledge management |
| Tool resources | MCP server configurations and marketplace sources | Tool management |
| Workflow resources | Input files and run outputs | Orchestration |
| External sources | Databases, APIs, GitHub repositories | Agents and knowledge bases |

A unified list and its screenshot can be added when the interface is implemented. Resources currently remain in their respective modules.

## Suggested fields {#建议字段}

| Field | Meaning |
| --- | --- |
| `resource_id` | Resource ID |
| `resource_type` | `file`, `media`, `knowledge`, `tool`, `workflow`, or `datasource` |
| `name` | Resource name |
| `uri` | OSS address, local path, or external URL |
| `mime_type` | File MIME type |
| `owner_type` | `user`, `tenant`, `agent`, or `workflow` |
| `owner_id` | Owning entity's ID |
| `metadata` | Page count, dimensions, model, chunk count, and other metadata |
| `status` | Uploading, available, processing, failed, or archived |

## Lifecycle {#生命周期}

```text
创建 -> 上传/生成 -> 解析/处理 -> 绑定业务 -> 使用 -> 归档/删除
```

- Keep original knowledge documents linked to their chunks.
- Record the model, prompt, and task ID for generated media.
- Link skill artifacts to their conversation and execution log.
- Record credential references for external resources without displaying secrets.

## Planned additions {#待补充}

| Area | Intended scope |
| --- | --- |
| Preview | Online document, image, audio, and video previews |
| Permissions | User, role, and tenant access controls |
| Auditing | Download, share, delete, and external-send records |
| Cleanup | Temporary-file expiration and orphan-resource detection |
