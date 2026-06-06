# 视觉索引同步机制

当前 App 运行时默认索引是正式 package：

- package manifest：`data/vision-index-packages/household-cn-grounding-dino-siglip/manifest.json`
- package metadata：`data/vision-index-packages/household-cn-grounding-dino-siglip/metadata.json`
- package vectors：`data/vision-index-packages/household-cn-grounding-dino-siglip/vectors.f32`
- 兼容指针：`data/vision-index-packages/current.json`
- JSON fallback：`data/vision-index.household-cn.grounding-dino-siglip.json`

旧 CLIP 索引仍保留在仓库里，但不再是默认命名 fallback：

- JSON 索引：`data/vision-index.household-cn.grounding-dino-clip.json`
- native metadata：`data/vision-index.household-cn.grounding-dino-clip.native-meta.json`
- native ids：`data/vision-index.household-cn.grounding-dino-clip.native-ids.json`
- native vectors：`data/vision-index.household-cn.grounding-dino-clip.native.f32`

配置位置：

- `src/config/app-config.js` 中的 `visionConfig.catalogIndexPackage` 和 `visionConfig.catalogModel`
- `scripts/analyze-photo-interface.mjs` 中的默认 `DEFAULT_INDEX_PACKAGE`
- `scripts/build-web.mjs` 的 required files

## 外部索引仓库

索引库的采集、标注、embedding、评测和正式发布放在独立仓库：

```text
/Users/guzeyu/workspace/home-memory-item-embedding
```

也可以通过环境变量覆盖：

```bash
HOME_MEMORY_ITEM_EMBEDDING_REPO=/path/to/home-memory-item-embedding npm run sync:vision-index
```

## 同步正式版本

当前仓库通过下面命令同步外部仓库的最新正式 package：

```bash
npm run sync:vision-index
```

默认同步：

```text
home-memory-item-embedding/data/generated/vision-index-packages/household-cn-grounding-dino-siglip-real-gallery-v2-plus-weak-v1-v2-full/
```

同步到当前仓库：

```text
data/vision-index-packages/household-cn-grounding-dino-siglip/
data/vision-index-packages/current.json
data/vision-index.household-cn.grounding-dino-siglip.json
```

同步脚本会校验：

- `manifest.json` 的 `kind/packageId/version/entryCount/dimension/assets`
- `metadata.json` entry 数量
- `vectors.f32` 字节数是否等于 `entryCount * dimension * 4`
- manifest 中声明的 metadata/vector sha256

## Release Manifest

如果外部仓库提供：

```text
data/releases/vision-index-current.json
```

同步脚本会优先读取其中声明的正式包路径。支持字段包括：

- `packagePath`
- `manifest`
- `current.packagePath`
- `current.manifest`
- `packages.catalog.packagePath`
- `packages.catalog.manifest`

没有 release manifest 时，脚本优先使用 3968 条的 generated 正式包；如果不存在，再回退到 `data/packages/<package-id>/`。

## Runtime 使用方式

当前 runtime 已默认使用正式包 `household-cn-grounding-dino-siglip`：

1. `visionConfig.catalogIndexPackage` 指向固定目录 `/data/vision-index-packages/household-cn-grounding-dino-siglip/`。
2. runtime 先读取 package `manifest.json` 和 `metadata.json`。
3. runtime 在首次真实检索时 lazy load `vectors.f32` 并缓存。
4. 在线 query crop embedding 使用同一个 `Xenova/siglip-base-patch16-224`。
5. 检索逻辑按 package 的 `dimension/metric/thresholds` 校验。

注意：iOS native embedding 插件当前仍是 CLIP/512 维实现，所以默认关闭 `nativeCatalogEmbeddingEnabled`，避免用 CLIP query 去查 SigLIP/768 维索引。后续如要恢复 native embedding，需要先把 native 插件升级到同一个 SigLIP 模型和 768 维输出。
