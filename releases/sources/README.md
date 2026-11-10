# 发行说明源记录

这里保存经过核对、可重新生成日志的正文。每个细化条目使用 `type(scope): 描述`，分类标题采用 New Features 🎉、Performance 🚀、Bug Fixes 🐞、Refactor 🔨、Document 📖、Other Changes 🔧，只填写实际存在的分类。

`pnpm version:packages` 在 Changesets 消费待发布记录前读取并校验正文，升版后将规范化结果归档到这里。包 scope 只进入对应包的 CHANGELOG，仓库 scope 只进入整体说明；依赖联动由标签中的真实包清单计算，不在源记录中重复罗列。

初始四个历史源文件根据既有标签、README、原 Changeset 和文件差异整理，文件顶部注释列出依据。它们是对已发生变更的说明修订，不改变旧标签或 npm 上的包。修订这些源记录后运行 `pnpm changelog:generate`，可重复生成历史发行说明、根 CHANGELOG 和各包 CHANGELOG。
