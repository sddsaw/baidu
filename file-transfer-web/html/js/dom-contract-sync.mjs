#!/usr/bin/env node
/**
 * =============================================================================
 * ProximaUI - Vue 3 + TS + Element Plus DOM 契约自动提取与 AutoTest 同步引擎
 * =============================================================================
 * 核心能力：
 * 1. 基于 @vue/compiler-sfc + @vue/compiler-dom 精确解析模板 AST（免疫 TS 泛型干扰）
 * 2. 基于 magic-string 缩进嗅探与 CRLF/LF 行尾符保持，100% 无损原位注入 data-testid
 * 3. 内置复制粘贴重复 data-testid 自愈重写（Duplicate Guard）
 * 4. 自动识别 v-for / #default 作用域插槽动态上下文与 data-test 断言占位符升级
 * 5. 内置 Element Plus 组件穿透适配器，自动生成 AutoTest/tests/pages/locators.py
 * 6. 同仓扫描 AutoTest/tests/**\/*.py 静态断链引用，精准定位失效用例文件与行号
 *
 * 用法：
 *   node scripts/dom-contract-sync.mjs             # 扫描注入源码 + 生成契约与 locators.py + 断链检查
 *   node scripts/dom-contract-sync.mjs --dry-run   # 仅预览变更与统计报告，不写盘
 *   node scripts/dom-contract-sync.mjs --check     # CI 门禁校验模式（不一致或存在断链则退出码为 1）
 * =============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { parse as parseSfc } from '@vue/compiler-sfc';
import { parse as parseDom, NodeTypes } from '@vue/compiler-dom';
import MagicString from 'magic-string';
import fg from 'fast-glob';

// ------------------------------ CLI 参数解析 ------------------------------
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isCheckMode = args.includes('--check');

function getArgValue(flag, defaultVal) {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : defaultVal;
}

const ROOT_DIR = process.cwd();
const SRC_DIR = getArgValue('--src', 'src');
const SCHEMA_REL_PATH = getArgValue('--schema', 'contracts/dom_schema.json');
const PYTHON_OUT_REL_PATH = getArgValue('--python-out', 'AutoTest/tests/pages/locators.py');
const AUTOTEST_TESTS_DIR = getArgValue('--autotest-dir', 'AutoTest/tests');

// ------------------------------ 常量与规则表 ------------------------------
const ACTION_EVENTS = new Set([
  'click',
  'dblclick',
  'contextmenu',
  'confirm',
  'cancel',
  'command',
  'tab-click',
  'node-click',
  'current-change',
  'size-change',
]);

const INPUT_EVENTS = new Set(['input', 'change']);

const MODAL_TAGS = new Set(['el-dialog', 'el-drawer']);
const TREE_TAGS = new Set(['el-tree']);
const TAB_TAGS = new Set(['el-tab-pane']);
const UPLOAD_TAGS = new Set(['el-upload']);
const TOGGLE_TAGS = new Set(['el-switch', 'el-checkbox', 'el-radio']);
const SELECT_TAGS = new Set([
  'select',
  'el-select',
  'el-tree-select',
  'el-cascader',
  'el-date-picker',
  'el-time-picker',
]);
const INPUT_TAGS = new Set(['input', 'textarea', 'el-input', 'el-input-number', 'el-autocomplete']);
const BUTTON_TAGS = new Set(['button', 'el-button', 'el-dropdown-item', 'el-popconfirm']);
const NAV_TAGS = new Set(['a', 'router-link']);

/**
 * 归一化路径为 POSIX 斜杠（兼容 Windows C:\project\... 反斜杠）
 */
function toPosixPath(p) {
  return p.replace(/\\/g, '/');
}

/**
 * 根据相对文件路径派生页面/组件作用域前缀 scope_name 与 Python 类名
 * 例: src/views/project/MainWorkspace.vue -> project_mainworkspace / ProjectMainworkspaceLocators
 */
function deriveScopeInfo(relFilePath) {
  const posix = toPosixPath(relFilePath);
  const withoutSrc = posix.replace(/^src\//, '').replace(/\.vue$/i, '');
  const parts = withoutSrc.split('/').filter(Boolean);

  let normalizedParts = parts;
  if (parts[0] === 'views' || parts[0] === 'pages') {
    normalizedParts = parts.slice(1);
  } else if (parts[0] === 'components') {
    normalizedParts = ['comp', ...parts.slice(1)];
  }

  // 处理 index.vue 同名折叠
  if (normalizedParts.length > 1 && normalizedParts[normalizedParts.length - 1].toLowerCase() === 'index') {
    normalizedParts.pop();
  }

  const slugParts = normalizedParts.map((seg) =>
    seg
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toLowerCase()
  );

  const scopeName = slugParts.join('_') || 'page';
  const className =
    scopeName
      .split('_')
      .filter(Boolean)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join('') + 'Locators';

  return { scopeName, className };
}

/**
 * 清洗 Vue 模板中的 TS / JS 表达式，提取可读的语义后缀
 */
function cleanExpression(rawExpr) {
  if (!rawExpr || typeof rawExpr !== 'string') return '';
  let expr = rawExpr.trim();

  // 剥离简单 TS 类型断言: `currentId as string` -> `currentId`
  expr = expr.replace(/\s+as\s+[A-Za-z0-9_<>[\]|&\s]+/g, '');

  // 剥离箭头函数包裹: `(e) => doWork(e)` -> `doWork(e)`
  expr = expr.replace(/^\([^)]*\)\s*=>\s*/, '').replace(/^[a-zA-Z_$][\w$]*\s*=>\s*/, '');

  // 识别布尔取反切换: `collapsed = !collapsed` -> `toggle_collapsed`
  const toggleMatch = expr.match(/^([a-zA-Z_$][\w$.]*)\s*=\s*!\s*\1$/);
  if (toggleMatch) {
    return 'toggle_' + sanitizeIdentifier(toggleMatch[1]);
  }

  // 识别状态赋值: `dialogVisible = true` -> `set_dialogvisible`
  const assignMatch = expr.match(/^([a-zA-Z_$][\w$.]*)\s*=\s*(.+)$/);
  if (assignMatch && !expr.includes('==')) {
    return 'set_' + sanitizeIdentifier(assignMatch[1]);
  }

  // 识别函数调用并提取方法名（若首个参数是短字符串字面量则一并拼接增强区分度）
  const callMatch = expr.match(/^([a-zA-Z_$][\w$.]*)\s*\(([^)]*)\)/);
  if (callMatch) {
    const fnName = callMatch[1].replace(/^\$?(?:router|emit)\./, '');
    const firstArg = callMatch[2].split(',')[0]?.trim() || '';
    const strLiteral = firstArg.match(/^['"]([a-zA-Z0-9_/-]{1,16})['"]$/);
    const combined = strLiteral ? `${fnName}_${strLiteral[1]}` : fnName;
    return sanitizeIdentifier(combined);
  }

  return sanitizeIdentifier(expr);
}

function sanitizeIdentifier(str) {
  if (!str) return '';
  return str
    .replace(/^\$+/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase()
    .slice(0, 32)
    .replace(/_+$/g, '');
}

/**
 * 提取元素节点的静态文本内容（用于注释展示）
 */
function extractElementInnerText(node) {
  if (!node.children || node.children.length === 0) return '';
  const chunks = [];
  for (const child of node.children) {
    if (child.type === NodeTypes.TEXT) {
      const t = child.content.trim();
      if (t) chunks.push(t);
    } else if (child.type === NodeTypes.INTERPOLATION && child.content?.content) {
      chunks.push(`{{ ${child.content.content.trim()} }}`);
    }
  }
  return chunks.join(' ').replace(/\s+/g, ' ').trim().slice(0, 40);
}

/**
 * 解析 v-for 或 #default 作用域插槽中的动态循环索引变量
 */
function extractDynamicScopeVar(node) {
  if (!node.props) return null;

  for (const prop of node.props) {
    if (prop.type !== NodeTypes.DIRECTIVE) continue;

    // 1. 检查 v-for="(item, index) in list" 或配合同节点的 :key="item.id"
    if (prop.name === 'for' && prop.exp?.content) {
      const forContent = prop.exp.content.trim();
      const tupleMatch = forContent.match(
        /^\(\s*([a-zA-Z_$][\w$]*)\s*,\s*([a-zA-Z_$][\w$]*)(?:\s*,\s*([a-zA-Z_$][\w$]*))?\s*\)\s+(?:in|of)\b/
      );
      if (tupleMatch) {
        return { isDynamic: true, dynamicVar: tupleMatch[3] || tupleMatch[2] };
      }
      // 若未解构 index，优先复用同节点已有的 :key 表达式（保证 TS 类型 100% 安全）
      const keyProp = node.props.find(
        (p) => p.type === NodeTypes.DIRECTIVE && p.name === 'bind' && p.arg?.content === 'key'
      );
      if (keyProp?.exp?.content && /^[a-zA-Z_$][\w$.]*$/.test(keyProp.exp.content.trim())) {
        return { isDynamic: true, dynamicVar: keyProp.exp.content.trim() };
      }
      return { isDynamic: true, dynamicVar: null };
    }

    // 2. 检查作用域插槽 <template #default="{ row, $index }"> 或 #default="scope"
    // 注意：JS 正则中 `$` 不属于 \w，不能用 \b\$index，需使用 [^\w$] 边界匹配
    if (prop.name === 'slot' && prop.exp?.content) {
      const slotExp = prop.exp.content.trim();
      if (/^\{[^}]*(?:^|[^\w$])\$index(?![\w$])[^}]*\}$/.test(slotExp)) {
        return { isDynamic: true, dynamicVar: '$index' };
      }
      if (/^\{[^}]*(?:^|[^\w$])index(?![\w$])[^}]*\}$/.test(slotExp)) {
        return { isDynamic: true, dynamicVar: 'index' };
      }
      if (/^[a-zA-Z_$][\w$]*$/.test(slotExp)) {
        return { isDynamic: true, dynamicVar: `${slotExp}.$index` };
      }
    }
  }
  return null;
}

/**
 * Element Plus 组件库穿透适配器：将原始标签与 data-testid 映射为 Playwright 可直接交互的选择器
 */
function buildPlaywrightSelector(tag, testId, staticAttrs, isDynamic, dynamicPlaceholder = '{index}') {
  const targetId = isDynamic ? `${testId}__${dynamicPlaceholder}` : testId;
  const base = `[data-testid='${targetId}']`;

  if (tag === 'el-input') {
    const innerTag = staticAttrs.get('type') === 'textarea' ? 'textarea' : 'input';
    return `${base} ${innerTag}`;
  }
  if (tag === 'el-input-number' || tag === 'el-autocomplete') {
    return `${base} input`;
  }
  if (tag === 'el-upload') {
    return `${base} input[type='file']`;
  }
  return base;
}

/**
 * 判定元素是否为目标交互/断言节点，并提取类型与语义特征
 */
function classifyElementNode(node, ancestorContext) {
  const tag = node.tag;
  if (tag === 'template' || tag === 'slot' || tag === 'transition' || tag === 'keep-alive') {
    return null;
  }

  const staticAttrs = new Map();
  let existingStaticTestIdProp = null;
  let existingDynamicTestIdProp = null;
  let dataTestPlaceholderProp = null;
  let modelDirective = null;
  const actionDirectives = [];
  const inputDirectives = [];

  for (const prop of node.props || []) {
    if (prop.type === NodeTypes.ATTRIBUTE) {
      staticAttrs.set(prop.name, prop.value?.content ?? '');
      if (prop.name === 'data-testid') {
        existingStaticTestIdProp = prop;
      } else if (prop.name === 'data-test' && !prop.value) {
        dataTestPlaceholderProp = prop;
      }
    } else if (prop.type === NodeTypes.DIRECTIVE) {
      if (prop.name === 'bind' && prop.arg?.content === 'data-testid') {
        existingDynamicTestIdProp = prop;
      } else if (prop.name === 'model') {
        modelDirective = prop;
      } else if (prop.name === 'on' && prop.arg?.content) {
        const evtName = prop.arg.content;
        if (ACTION_EVENTS.has(evtName)) actionDirectives.push(prop);
        if (INPUT_EVENTS.has(evtName)) inputDirectives.push(prop);
      }
    }
  }

  const hasExistingTestId = Boolean(existingStaticTestIdProp || existingDynamicTestIdProp);

  // 1. 判定 elementType
  let elementType = null;
  if (dataTestPlaceholderProp) {
    elementType = 'text';
  } else if (MODAL_TAGS.has(tag)) {
    elementType = 'modal';
  } else if (TREE_TAGS.has(tag)) {
    elementType = 'tree';
  } else if (TAB_TAGS.has(tag)) {
    elementType = 'tab';
  } else if (UPLOAD_TAGS.has(tag)) {
    elementType = 'upload';
  } else if (TOGGLE_TAGS.has(tag)) {
    elementType = 'toggle';
  } else if (SELECT_TAGS.has(tag)) {
    elementType = 'select';
  } else if (
    INPUT_TAGS.has(tag) ||
    (modelDirective && !MODAL_TAGS.has(tag) && modelDirective.arg?.content !== 'visible') ||
    inputDirectives.length > 0
  ) {
    elementType = 'input';
  } else if (NAV_TAGS.has(tag)) {
    elementType = 'nav';
  } else if (BUTTON_TAGS.has(tag) || actionDirectives.length > 0) {
    elementType = 'btn';
  } else if (hasExistingTestId) {
    elementType = 'el';
  }

  if (!elementType) return null;

  // 2. 提取语义标识 semantic_key
  let semanticKey = '';
  if (elementType === 'text') {
    // 从插值表达式 {{ runStatus }} 提取字段名
    const interpChild = (node.children || []).find((c) => c.type === NodeTypes.INTERPOLATION);
    semanticKey = cleanExpression(interpChild?.content?.content || '');
  }
  if (!semanticKey && modelDirective?.exp?.content) {
    semanticKey = cleanExpression(modelDirective.exp.content);
  }
  if (!semanticKey && actionDirectives[0]?.exp?.content) {
    semanticKey = cleanExpression(actionDirectives[0].exp.content);
  }
  if (!semanticKey && inputDirectives[0]?.exp?.content) {
    semanticKey = cleanExpression(inputDirectives[0].exp.content);
  }
  if (!semanticKey) {
    const fallbackCandidate =
      ancestorContext.formItemProp ||
      staticAttrs.get('prop') ||
      staticAttrs.get('name') ||
      staticAttrs.get('command') ||
      staticAttrs.get('to') ||
      '';
    semanticKey = sanitizeIdentifier(fallbackCandidate);
  }
  if (!semanticKey) {
    semanticKey = sanitizeIdentifier(tag.replace(/^el-/, ''));
  }

  // 3. 提取人类可读标签文案（用于写入 Python 注释）
  const innerText = extractElementInnerText(node);
  const label =
    staticAttrs.get('placeholder') ||
    staticAttrs.get('label') ||
    staticAttrs.get('title') ||
    innerText ||
    (ancestorContext.tooltip ? `${ancestorContext.tooltip} (Tooltip)` : '') ||
    ancestorContext.formItemLabel ||
    tag;

  return {
    tag,
    elementType,
    semanticKey,
    label,
    staticAttrs,
    existingStaticTestIdProp,
    existingDynamicTestIdProp,
    dataTestPlaceholderProp,
  };
}

/**
 * 解析已有动态 :data-testid="`foo__${index}`" 中的基础 testid 与变量名
 */
function parseExistingDynamicTestId(expContent) {
  if (!expContent) return null;
  const trimmed = expContent.trim();
  const tplMatch = trimmed.match(/^`([a-zA-Z0-9_-]+)__\$\{([^}]+)\}`$/);
  if (tplMatch) {
    return { baseId: tplMatch[1], dynamicVar: tplMatch[2].trim() };
  }
  return null;
}

/**
 * 核心单次扫描引擎（支持注入态与纯读取态，确保多行折行插入后行号 100% 精确对齐）
 */
function runAstPass(sourceText, relFilePath, globalSeenTestIds, enableLog = true) {
  const { descriptor, errors } = parseSfc(sourceText, { filename: relFilePath });

  if (errors.length > 0 || !descriptor.template || descriptor.template.src) {
    return null;
  }

  const templateContent = descriptor.template.content;
  const templateBaseOffset = descriptor.template.loc.start.offset;
  const templateAst = parseDom(templateContent, { comments: true });

  const magic = new MagicString(sourceText);
  const { scopeName, className } = deriveScopeInfo(relFilePath);

  const elementsSchema = {};
  const scopeKeyCounter = new Map();
  let mutatedCount = 0;
  let healedDuplicateCount = 0;

  function allocateUniqueIds(elementType, semanticKey) {
    const baseShortKey = `${elementType}_${semanticKey}`.replace(/_+/g, '_');
    const count = (scopeKeyCounter.get(baseShortKey) || 0) + 1;
    scopeKeyCounter.set(baseShortKey, count);

    const finalShortKey = count === 1 ? baseShortKey : `${baseShortKey}_${count}`;
    const finalTestId = `${scopeName}__${finalShortKey}`;
    return { finalShortKey, finalTestId };
  }

  function walk(node, ancestorStack) {
    if (node.type === NodeTypes.ELEMENT) {
      const nextContext = { ...ancestorContextFromStack(ancestorStack, node) };
      const dynamicInfo = extractDynamicScopeVar(node);
      const effectiveDynamic = dynamicInfo || ancestorStack.dynamicInfo;

      const classified = classifyElementNode(node, nextContext);
      if (classified) {
        const {
          tag,
          elementType,
          semanticKey,
          label,
          staticAttrs,
          existingStaticTestIdProp,
          existingDynamicTestIdProp,
          dataTestPlaceholderProp,
        } = classified;

        const isDynamicBinding = Boolean(effectiveDynamic?.isDynamic && effectiveDynamic?.dynamicVar);
        const dynamicVar = effectiveDynamic?.dynamicVar || null;
        const realLine = descriptor.template.loc.start.line + node.loc.start.line - 1;

        let finalShortKey = '';
        let finalTestId = '';

        // 情况 A：已存在静态 data-testid 或动态 :data-testid
        if (existingStaticTestIdProp || existingDynamicTestIdProp) {
          let currentId = '';
          let parsedDyn = null;

          if (existingStaticTestIdProp) {
            currentId = existingStaticTestIdProp.value?.content?.trim() || '';
          } else if (existingDynamicTestIdProp) {
            parsedDyn = parseExistingDynamicTestId(existingDynamicTestIdProp.exp?.content);
            currentId = parsedDyn?.baseId || '';
          }

          // 检查是否存在“复制粘贴”引发的重复 ID 冲突
          if (!currentId || globalSeenTestIds.has(currentId)) {
            const allocated = allocateUniqueIds(elementType, semanticKey);
            finalShortKey = allocated.finalShortKey;
            finalTestId = allocated.finalTestId;

            const targetProp = existingStaticTestIdProp || existingDynamicTestIdProp;
            const propStart = templateBaseOffset + targetProp.loc.start.offset;
            const propEnd = templateBaseOffset + targetProp.loc.end.offset;
            const replacementAttr = isDynamicBinding
              ? `:data-testid="\`${finalTestId}__\${${dynamicVar}}\`"`
              : `data-testid="${finalTestId}"`;

            magic.overwrite(propStart, propEnd, replacementAttr);
            mutatedCount++;
            healedDuplicateCount++;
            if (enableLog) {
              console.log(
                `  [Self-Heal] 修复重复/空 ID (${toPosixPath(relFilePath)}:${realLine}): "${currentId}" -> "${finalTestId}"`
              );
            }
          } else {
            // 合法存量 ID：100% 保持原样收录
            finalTestId = currentId;
            const stripped = currentId.startsWith(`${scopeName}__`)
              ? currentId.slice(scopeName.length + 2)
              : sanitizeIdentifier(currentId);
            finalShortKey = stripped || `${elementType}_${semanticKey}`;
            if (elementsSchema[finalShortKey]) {
              const c = (scopeKeyCounter.get(finalShortKey) || 1) + 1;
              scopeKeyCounter.set(finalShortKey, c);
              finalShortKey = `${finalShortKey}_${c}`;
            }
          }
        } else {
          // 情况 B：无 data-testid，执行无损原位注入（或升级 data-test 占位符）
          const allocated = allocateUniqueIds(elementType, semanticKey);
          finalShortKey = allocated.finalShortKey;
          finalTestId = allocated.finalTestId;

          const newAttrString = isDynamicBinding
            ? `:data-testid="\`${finalTestId}__\${${dynamicVar}}\`"`
            : `data-testid="${finalTestId}"`;

          if (dataTestPlaceholderProp) {
            const pStart = templateBaseOffset + dataTestPlaceholderProp.loc.start.offset;
            const pEnd = templateBaseOffset + dataTestPlaceholderProp.loc.end.offset;
            magic.overwrite(pStart, pEnd, newAttrString);
            mutatedCount++;
          } else {
            const tagFileOffset = templateBaseOffset + node.loc.start.offset;
            const expectedTagPrefix = `<${tag}`;
            if (sourceText.slice(tagFileOffset, tagFileOffset + expectedTagPrefix.length) === expectedTagPrefix) {
              const afterTagNameOffset = tagFileOffset + expectedTagPrefix.length;
              const firstProp = node.props?.[0];

              if (firstProp) {
                const firstPropFileOffset = templateBaseOffset + firstProp.loc.start.offset;
                const gapBetweenTagAndProp = sourceText.slice(afterTagNameOffset, firstPropFileOffset);
                const multilineIndentMatch = gapBetweenTagAndProp.match(/(\r?\n[ \t]*)$/);

                if (multilineIndentMatch) {
                  magic.appendLeft(firstPropFileOffset, `${newAttrString}${multilineIndentMatch[1]}`);
                } else {
                  magic.appendLeft(afterTagNameOffset, ` ${newAttrString}`);
                }
              } else {
                magic.appendLeft(afterTagNameOffset, ` ${newAttrString}`);
              }
              mutatedCount++;
            }
          }
        }

        globalSeenTestIds.set(finalTestId, `${toPosixPath(relFilePath)}:${realLine}`);

        const finalDynamicFlag = Boolean(
          isDynamicBinding || parseExistingDynamicTestId(existingDynamicTestIdProp?.exp?.content)
        );
        const finalDynamicVar =
          dynamicVar || parseExistingDynamicTestId(existingDynamicTestIdProp?.exp?.content)?.dynamicVar || null;

        const record = {
          testid: finalTestId,
          tag,
          type: elementType,
          dynamic: finalDynamicFlag,
          label,
          line: realLine,
        };

        if (finalDynamicFlag) {
          record.dynamicVar = finalDynamicVar;
          record.selectorTemplate = buildPlaywrightSelector(tag, finalTestId, staticAttrs, true, '{index}');
        } else {
          record.selector = buildPlaywrightSelector(tag, finalTestId, staticAttrs, false);
        }

        elementsSchema[finalShortKey] = record;
      }

      const nextStack = {
        ...nextContext,
        dynamicInfo: effectiveDynamic,
      };
      for (const child of node.children || []) {
        walk(child, nextStack);
      }
      return;
    }

    for (const child of node.children || []) {
      walk(child, ancestorStack);
    }
  }

  walk(templateAst, {
    tooltip: '',
    formItemLabel: '',
    formItemProp: '',
    dynamicInfo: null,
  });

  return {
    scopeName,
    className,
    updatedSource: magic.toString(),
    elementsSchema,
    mutatedCount,
    healedDuplicateCount,
  };
}

/**
 * 扫描并无损注入单个 .vue 文件
 */
function processVueFile(absFilePath, relFilePath, globalSeenTestIds) {
  const rawSource = fs.readFileSync(absFilePath, 'utf8');
  const seenBeforeFile = new Map(globalSeenTestIds);

  const firstPass = runAstPass(rawSource, relFilePath, globalSeenTestIds, true);
  if (!firstPass) return null;

  const hasFileChanged = firstPass.updatedSource !== rawSource;
  let finalElementsSchema = firstPass.elementsSchema;

  if (hasFileChanged) {
    // 二次解析注入后的文本，确保多行属性换行插入后 schema 与 locators.py 中的行号 100% 精确
    globalSeenTestIds.clear();
    for (const [k, v] of seenBeforeFile) globalSeenTestIds.set(k, v);
    const secondPass = runAstPass(firstPass.updatedSource, relFilePath, globalSeenTestIds, false);
    if (secondPass) {
      finalElementsSchema = secondPass.elementsSchema;
    }

    if (!isDryRun && !isCheckMode) {
      fs.writeFileSync(absFilePath, firstPass.updatedSource, 'utf8');
    }
  }

  return {
    scopeName: firstPass.scopeName,
    className: firstPass.className,
    relFilePath: toPosixPath(relFilePath),
    elementsSchema: finalElementsSchema,
    hasFileChanged,
    mutatedCount: firstPass.mutatedCount,
    healedDuplicateCount: firstPass.healedDuplicateCount,
  };
}

/**
 * 提取父容器向下传递的业务语义（如 <el-tooltip content="..."> 与 <el-form-item label="..." prop="...">）
 */
function ancestorContextFromStack(prevContext, node) {
  let { tooltip, formItemLabel, formItemProp } = prevContext;

  if (node.tag === 'el-tooltip') {
    const contentProp = (node.props || []).find(
      (p) => p.type === NodeTypes.ATTRIBUTE && p.name === 'content'
    );
    if (contentProp?.value?.content) {
      tooltip = contentProp.value.content.trim();
    }
  } else if (node.tag === 'el-form-item') {
    for (const p of node.props || []) {
      if (p.type === NodeTypes.ATTRIBUTE && p.name === 'label' && p.value?.content) {
        formItemLabel = p.value.content.trim();
      }
      if (p.type === NodeTypes.ATTRIBUTE && p.name === 'prop' && p.value?.content) {
        formItemProp = p.value.content.trim();
      }
    }
  }

  return { tooltip, formItemLabel, formItemProp };
}

/**
 * 根据契约 Schema 生成 Python AutoTest/tests/pages/locators.py 代码
 */
function generatePythonLocatorsCode(schemaObj) {
  const lines = [
    '"""',
    '======================================================================',
    '此文件由前端 DOM 契约同步工具 (scripts/dom-contract-sync.mjs) 自动生成，禁止手动编辑！',
    '前端栈: Vue 3 + TS + Element Plus | 测试驱动: Playwright 1.60 (Async) + BS4',
    '======================================================================',
    '"""',
    '',
  ];

  // 记录生成的 Python 类及所有合法成员集合，供同仓 Python 断链检查使用
  const validPythonSymbols = new Map();

  const pageKeys = Object.keys(schemaObj.pages).sort();
  for (const scopeName of pageKeys) {
    const pageInfo = schemaObj.pages[scopeName];
    const elementEntries = Object.entries(pageInfo.elements);
    if (elementEntries.length === 0) continue;

    const className = pageInfo.className;
    const memberSet = new Set(['within_scope']);
    validPythonSymbols.set(className, memberSet);

    lines.push('');
    lines.push(`class ${className}:`);
    lines.push(`    """页面契约: ${pageInfo.sourceFile}"""`);
    lines.push('');

    // 先输出静态定位符常量，再输出动态行静态方法
    const staticEntries = elementEntries.filter(([, meta]) => !meta.dynamic);
    const dynamicEntries = elementEntries.filter(([, meta]) => meta.dynamic);

    for (const [shortKey, meta] of staticEntries) {
      const constName = shortKey.toUpperCase();
      const tidConstName = `${constName}_TID`;
      memberSet.add(constName);
      memberSet.add(tidConstName);

      const safeLabel = meta.label.replace(/\r?\n/g, ' ');
      lines.push(`    # [${meta.type}] ${safeLabel} (${meta.tag}) | Line: ${meta.line}`);
      lines.push(`    ${constName} = "${meta.selector}"`);
      lines.push(`    ${tidConstName} = "${meta.testid}"`);
      lines.push('');
    }

    for (const [shortKey, meta] of dynamicEntries) {
      const methodName = shortKey.toLowerCase();
      const baseTidConst = `${shortKey.toUpperCase()}_PREFIX`;
      memberSet.add(methodName);
      memberSet.add(baseTidConst);

      const pyTemplate = meta.selectorTemplate.replace('{index}', '{index}');
      const safeLabel = meta.label.replace(/\r?\n/g, ' ');

      lines.push(`    # [动态列表 ${meta.type}] ${safeLabel} (${meta.tag}) | Line: ${meta.line}`);
      lines.push(`    ${baseTidConst} = "${meta.testid}"`);
      lines.push('    @staticmethod');
      lines.push(`    def ${methodName}(index: int | str = 0) -> str:`);
      lines.push(`        """定位动态列表/树节点第 index 项: ${safeLabel}"""`);
      lines.push(`        return f"${pyTemplate}"`);
      lines.push('');
    }

    lines.push('    @staticmethod');
    lines.push('    def within_scope(scope: str, child_selector: str) -> str:');
    lines.push('        """组合定位同页多实例复用子组件"""');
    lines.push('        return f"[data-test-scope=\'{scope}\'] {child_selector}"');
    lines.push('');
  }

  return { pythonCode: lines.join('\n'), validPythonSymbols };
}

/**
 * 同仓静态扫描 AutoTest/tests/**\/*.py 中是否存在已失效的 Locators 常量/方法引用
 */
async function scanPythonBrokenReferences(autotestAbsDir, pythonOutAbsPath, validPythonSymbols) {
  if (!fs.existsSync(autotestAbsDir)) return [];

  const pyFiles = await fg('**/*.py', {
    cwd: autotestAbsDir,
    absolute: true,
    ignore: ['**/__pycache__/**'],
  });

  const brokenRefs = [];

  for (const pyFile of pyFiles) {
    if (path.resolve(pyFile) === path.resolve(pythonOutAbsPath)) continue;

    const content = fs.readFileSync(pyFile, 'utf8');
    const relPyPath = toPosixPath(path.relative(ROOT_DIR, pyFile));
    const lines = content.split(/\r?\n/);

    // 1. 解析别名导入: `from ...locators import MainWorkspaceLocators as Loc`
    const aliasToClass = new Map();
    const importRegex = /\bimport\s+([A-Za-z0-9_,\s]+)$/gm;
    let impMatch;
    while ((impMatch = importRegex.exec(content)) !== null) {
      const clause = impMatch[1];
      for (const part of clause.split(',')) {
        const asMatch = part.trim().match(/^([A-Z][A-Za-z0-9]*Locators)(?:\s+as\s+([A-Za-z_][A-Za-z0-9_]*))?$/);
        if (asMatch) {
          const origClass = asMatch[1];
          const alias = asMatch[2] || origClass;
          aliasToClass.set(alias, origClass);
        }
      }
    }

    // 2. 逐行扫描 `XxxLocators.MEMBER` 或 `Alias.MEMBER` 引用
    lines.forEach((lineText, idx) => {
      const trimmed = lineText.trim();
      if (trimmed.startsWith('#')) return;

      const refRegex = /\b([A-Za-z_][A-Za-z0-9_]*)\.([A-Za-z_][A-Za-z0-9_]*)\b/g;
      let m;
      while ((m = refRegex.exec(lineText)) !== null) {
        const objName = m[1];
        const memberName = m[2];

        const targetClass = aliasToClass.get(objName) || (objName.endsWith('Locators') ? objName : null);
        if (!targetClass) continue;

        const validMembers = validPythonSymbols.get(targetClass);
        if (!validMembers) {
          brokenRefs.push({
            file: relPyPath,
            line: idx + 1,
            symbol: `${targetClass}.${memberName}`,
            reason: `定位类 ${targetClass} 对应的前端组件已被删除或重命名`,
          });
        } else if (!validMembers.has(memberName)) {
          brokenRefs.push({
            file: relPyPath,
            line: idx + 1,
            symbol: `${targetClass}.${memberName}`,
            reason: `定位常量/方法 ${memberName} 在前端模板中已不存在`,
          });
        }
      }
    });
  }

  return brokenRefs;
}

/**
 * 主执行入口
 */
async function main() {
  const srcAbsDir = path.resolve(ROOT_DIR, SRC_DIR);
  const schemaAbsPath = path.resolve(ROOT_DIR, SCHEMA_REL_PATH);
  const pythonOutAbsPath = path.resolve(ROOT_DIR, PYTHON_OUT_REL_PATH);
  const autotestAbsDir = path.resolve(ROOT_DIR, AUTOTEST_TESTS_DIR);

  if (!fs.existsSync(srcAbsDir)) {
    console.error(`[ERROR] 未找到前端源码目录: ${srcAbsDir}`);
    process.exit(1);
  }

  const vueFiles = await fg('**/*.vue', {
    cwd: srcAbsDir,
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**'],
  });
  vueFiles.sort();

  const globalSeenTestIds = new Map();
  const schemaObj = {
    schemaVersion: '2.0',
    framework: 'vue3-ts-element-plus',
    pages: {},
  };

  let changedVueFilesCount = 0;
  let totalElementsCount = 0;
  let totalInjectedCount = 0;
  let totalHealedCount = 0;

  for (const absFile of vueFiles) {
    const relFile = path.relative(ROOT_DIR, absFile);
    const result = processVueFile(absFile, relFile, globalSeenTestIds);
    if (!result) continue;

    const elemCount = Object.keys(result.elementsSchema).length;
    if (elemCount > 0) {
      schemaObj.pages[result.scopeName] = {
        className: result.className,
        sourceFile: result.relFilePath,
        elements: result.elementsSchema,
      };
      totalElementsCount += elemCount;
    }

    if (result.hasFileChanged) {
      changedVueFilesCount++;
      totalInjectedCount += result.mutatedCount;
      totalHealedCount += result.healedDuplicateCount;
      const modeTag = isDryRun ? '[DRY-RUN]' : isCheckMode ? '[UNSYNCED]' : '[UPDATED]';
      console.log(`${modeTag} ${result.relFilePath} (变更节点: ${result.mutatedCount})`);
    }
  }

  const schemaJsonStr = JSON.stringify(schemaObj, null, 2) + '\n';
  const { pythonCode, validPythonSymbols } = generatePythonLocatorsCode(schemaObj);

  const prevSchemaStr = fs.existsSync(schemaAbsPath) ? fs.readFileSync(schemaAbsPath, 'utf8') : '';
  const prevPyStr = fs.existsSync(pythonOutAbsPath) ? fs.readFileSync(pythonOutAbsPath, 'utf8') : '';
  const isSchemaOutdated = prevSchemaStr !== schemaJsonStr;
  const isPyOutdated = prevPyStr !== pythonCode;

  if (!isDryRun && !isCheckMode) {
    if (isSchemaOutdated) {
      fs.mkdirSync(path.dirname(schemaAbsPath), { recursive: true });
      fs.writeFileSync(schemaAbsPath, schemaJsonStr, 'utf8');
      console.log(`[GENERATED] 契约真理源已更新: ${toPosixPath(SCHEMA_REL_PATH)}`);
    }
    if (isPyOutdated) {
      fs.mkdirSync(path.dirname(pythonOutAbsPath), { recursive: true });
      fs.writeFileSync(pythonOutAbsPath, pythonCode, 'utf8');
      console.log(`[GENERATED] Python 定位器已同步: ${toPosixPath(PYTHON_OUT_REL_PATH)}`);
    }
  }

  // 执行同仓 Python 测试用例静态断链扫描
  const brokenRefs = await scanPythonBrokenReferences(autotestAbsDir, pythonOutAbsPath, validPythonSymbols);

  console.log('\n==================== DOM 契约扫描汇总 ====================');
  console.log(`扫描 Vue 组件总数 : ${vueFiles.length}`);
  console.log(`纳管定位契约节点  : ${totalElementsCount}`);
  console.log(`本次新增/修复属性 : ${totalInjectedCount} (其中复制粘贴重复自愈: ${totalHealedCount})`);
  console.log(`Python 断链引用数 : ${brokenRefs.length}`);
  console.log('==========================================================');

  if (brokenRefs.length > 0) {
    console.error('\n[BREAKING CHANGE 告警] 检测到 AutoTest 用例引用了已删除或重命名的前端定位常量：');
    for (const item of brokenRefs) {
      console.error(`  -> ${item.file}:${item.line} 引用了 [${item.symbol}] (${item.reason})`);
    }
  }

  if (isCheckMode) {
    if (changedVueFilesCount > 0 || isSchemaOutdated || isPyOutdated || brokenRefs.length > 0) {
      console.error(
        '\n[CHECK FAILED] 前端源码、dom_schema.json、locators.py 未同步或存在失效引用，请先运行 `npm run testid:sync`！'
      );
      process.exit(1);
    }
    console.log('\n[CHECK PASSED] 前后端 DOM 定位契约 100% 同步且无断链引用！');
  }
}

main().catch((err) => {
  console.error('[FATAL] 契约同步脚本执行异常:', err);
  process.exit(1);
});
