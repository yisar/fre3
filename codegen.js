import { EmbeddedCode, CodeText, JSXElement, JSXElementKind, JSXText, JSXComment, JSXInsert, JSXStaticField, JSXDynamicField, JSXStyleProperty, JSXSpread } from "./AST"
import { locationMark } from "./sourcemap"
import { getFieldData } from "./fieldData"
export { codeGen, codeStr }



const rx = {
  backslashes: /\\/g,
  newlines: /\r?\n/g,
  hasParen: /\(/,
  loneFunction: /^function |^\(\w*\) =>|^\w+ =>/,
  endsInParen: /\)\s*$/,
  nonIdChars: /[^a-zA-Z0-9]/g,
  doubleQuotes: /"/g,
  indent: /\n(?=[^\n]+$)([ \t]*)/
}
class DOMExpression {
  constructor(ids, statements, computations) {
    this.ids = ids
    this.statements = statements
    this.computations = computations
  }
}
class Computation {
  constructor(statements, loc, stateVar, seed) {
    this.statements = statements
    this.loc = loc
    this.stateVar = stateVar
    this.seed = seed
  }
}
class SubComponent {
  constructor(name, refs, fns, properties, children, loc) {
    this.name = name
    this.refs = refs
    this.fns = fns
    this.properties = properties
    this.children = children
    this.loc = loc
  }
}
const isStaticClassField = (p, svg) => {
  return p.type === JSXStaticField && getFieldData(p.name, svg)[0] === (svg ? "class" : "className")
}
const noApparentSignals = (code) => {
  return !rx.hasParen.test(code) || rx.loneFunction.test(code) && !rx.endsInParen.test(code)
}
const calculateIndent = (previousCode) => {
  const m = rx.indent.exec(previousCode)
  const pad = m ? m[1] : ""
  const nl = `\r
${pad}`
  const nli = `${nl}    `
  const nlii = `${nli}    `
  return { nl, nli, nlii }
}
const codeStr = (str) => {
  return `"${str.replace(rx.backslashes, "\\\\").replace(rx.doubleQuotes, '\\"').replace(rx.newlines, "\\n")}"`
}
const markLoc = (str, loc, opts) => {
  return opts.sourcemap && loc ? locationMark(loc) + str : str
}
const markBlockLocs = (str, loc, opts) => {
  if (!opts.sourcemap || !loc) return str
  const lines = str.split("\n")
  let offset = 0
  for (let i = 1; i < lines.length; i++) {
    offset += lines[i - 1].length
    const lineloc = {
      line: loc.line + i,
      col: 0,
      pos: loc.pos + offset + i,
      // +i for newline characters
      file: loc.file
      // Keep file if present
    }
    lines[i] = locationMark(lineloc) + lines[i]
  }
  return locationMark(loc) + lines.join("\n")
}
const compileCodeText = (node, opts) => {
  return markBlockLocs(node.text, node.loc, opts)
}
const compileSegments = (node, opts) => {
  return node.segments.reduce((acc, s) => acc + compileSegment(s, acc, opts), "")
}
const compileSegment = (node, previousCode, opts) => {
  if (node.type === CodeText) {
    return compileCodeText(node, opts)
  } else {
    const currentIndent = calculateIndent(previousCode)
    return compileJSXElement(node, currentIndent, opts)
  }
}
const compileJSXElement = (node, indentObj, opts) => {
  const code = node.kind === JSXElementKind.SubComponent ? compileSubComponent(node, indentObj, opts) : compileHtmlElement(node, indentObj, opts)
  return markLoc(code, node.loc, opts)
}
const buildSubComponentAst = (node, opts) => {
  const refs = node.references.map((r) => compileSegments(r.code, opts))
  const fns = node.functions.map((r) => compileSegments(r.code, opts))
  const properties = node.fields.reduce((props, p) => {
    const value = p.type === JSXStaticField ? p.value : compileSegments(p.code, opts)
    const lastSegment = props.length > 0 ? props[props.length - 1] : null
    if (p.type === JSXSpread) {
      props.push(value)
    } else if (lastSegment === null || typeof lastSegment === "string" || p.type === JSXStyleProperty && lastSegment["style"]) {
      props.push({ [p.name]: value })
    } else {
      lastSegment[p.name] = value
    }
    return props
  }, [])
  const children = node.content.map((c) => {
    if (c.type === JSXElement) return compileJSXElement(c, calculateIndent(""), opts)
    if (c.type === JSXText) return codeStr(c.text)
    if (c.type === JSXInsert) return compileSegments(c.code, opts)
    return `document.createComment(${codeStr(c.text)})`
  })
  return new SubComponent(node.tag, refs, fns, properties, children, node.loc)
}
const emitSubComponent = (sub, indentObj, opts) => {
  const { nl, nli, nlii } = indentObj
  const childrenExpr = sub.children.length === 0 ? null : sub.children.length === 1 ? sub.children[0] : `[${nlii}${sub.children.join("," + nlii)}${nli}]`
  let finalProperties = [...sub.properties]
  if (childrenExpr !== null) {
    const lastProp = finalProperties.length > 0 ? finalProperties[finalProperties.length - 1] : null
    if (lastProp && typeof lastProp !== "string") {
      lastProp.children = childrenExpr
    } else {
      finalProperties.push({ children: childrenExpr })
    }
  }
  if (finalProperties.length > 1 && typeof finalProperties[0] === "string") {
    finalProperties.unshift({})
  } else if (finalProperties.length === 0) {
    finalProperties.push({})
  }
  const propertyExprs = finalProperties.map(
    (obj) => typeof obj === "string" ? obj : (
      // Spread expression
      `{${Object.entries(obj).map(([p, v]) => `${nli}${codeStr(p)}: ${v}`).join(",")}${nl}}`
    )
  )
  const propertiesString = propertyExprs.length === 1 ? propertyExprs[0] : `Object.assign(${propertyExprs.join(", ")})`
  let expr = `${sub.name}(${propertiesString})`
  if (sub.refs.length > 0) {
    expr = `${sub.refs.map((r) => `${r} = `).join("")}${expr}`
  }
  if (sub.fns.length > 0) {
    const comps = sub.fns.map((fn) => new Computation([`(${fn})(__, __state);`], sub.loc, "__state", null))
    expr = `(function (__) {${nli}var __ = ${expr};${nli}${comps.map((comp) => emitComputation(comp, indentObj, opts)).join(nli)}${nli}return __;${nl}})()`
  }
  return expr
}
const compileSubComponent = (node, indentObj, opts) => {
  const subComponentAst = buildSubComponentAst(node, opts)
  return emitSubComponent(subComponentAst, indentObj, opts)
}
const addIdToContext = (ctx, parent, tag, n) => {
  tag = tag.replace(rx.nonIdChars, "_")
  const id = parent === "" ? "__" : `${parent}${parent.endsWith("_") ? "" : "_"}${tag}${n + 1}`
  ctx.ids.push(id)
  return id
}
const addStatementToContext = (ctx, stmt) => {
  ctx.statements.push(stmt)
}
const addComputationToContext = (ctx, body, stateVar, seed, loc) => {
  ctx.computations.push(new Computation(body, loc, stateVar, seed))
}
const buildHtmlElementAst = (node, parentId, DOMElemIndex, ctx) => {
  const { tag, fields, references, functions, content, loc } = node
  const { opts } = ctx
  if (node.kind === JSXElementKind.SubComponent) {
    const subComponentNodeAsInsert = {
      type: JSXInsert,
      code: { type: EmbeddedCode, segments: [node], loc: node.loc },
      loc: node.loc
    }
    buildJSXInsert(subComponentNodeAsInsert, parentId, DOMElemIndex, ctx)
    return
  }
  const elementId = ctx.addId(parentId, tag, DOMElemIndex)
  const isSvg = node.kind === JSXElementKind.SVG
  const fieldExprs = fields.map((p) => p.type === JSXStaticField ? "" : compileSegments(p.code, opts))
  const spreads = fields.filter((p) => p.type === JSXSpread || p.type === JSXStyleProperty)
  const classField = spreads.length === 0 ? fields.find((p) => isStaticClassField(p, isSvg)) : void 0
  const fieldsAreDynamic = fieldExprs.some((e) => !noApparentSignals(e))
  const refStmts = references.map((r) => `${compileSegments(r.code, opts)} = `).join("")
  ctx.addStatement(
    `${elementId} = ${refStmts}Surplus.create${isSvg ? "Svg" : ""}Element(${codeStr(tag)}, ${classField ? classField.value : null}, ${parentId || "null"});`
  )
  const fieldStmts = fields.map((field, i) => {
    if (field === classField) return ""
    const expr = fieldExprs[i]
    if (field.type === JSXStaticField) return buildField(elementId, field, field.value, isSvg)
    if (field.type === JSXDynamicField) return buildField(elementId, field, expr, isSvg)
    if (field.type === JSXStyleProperty) return `Surplus.assign(${elementId}.style, ${expr});`
    return `Surplus.spread(${elementId}, ${expr}, ${isSvg});`
  }).filter((s) => s !== "")
  if (!fieldsAreDynamic) {
    fieldStmts.forEach((stmt) => ctx.addStatement(stmt))
  }
  if (content.length === 1 && content[0].type === JSXInsert) {
    buildJSXContent(content[0], elementId, ctx)
  } else {
    content.forEach((child, i) => buildChild(child, elementId, i, ctx))
  }
  if (fieldsAreDynamic) {
    ctx.addComputation(fieldStmts, null, null, loc)
  }
  functions.forEach((f) => {
    const expr = compileSegments(f.code, opts)
    ctx.addComputation([`(${expr})(${elementId}, __state);`], "__state", null, f.loc)
  })
}
const buildField = (id, field, expr, isSvg) => {
  const [name, namespace, flags] = getFieldData(field.name, isSvg)
  const type = flags & 3
  if (type === 0) {
    return namespace ? `${id}.${namespace}.${name} = ${expr};` : `${id}.${name} = ${expr};`
  }
  if (type === 1) {
    return namespace ? `Surplus.setAttributeNS(${id}, ${codeStr(namespace)}, ${codeStr(name)}, ${expr});` : `Surplus.setAttribute(${id}, ${codeStr(name)}, ${expr});`
  }
  return ""
}
const buildChild = (node, parentId, index, ctx) => {
  if (node.type === JSXElement) return buildHtmlElementAst(node, parentId, index, ctx)
  if (node.type === JSXComment) return ctx.addStatement(`Surplus.createComment(${codeStr(node.text)}, ${parentId});`)
  if (node.type === JSXText) return ctx.addStatement(`Surplus.createTextNode(${codeStr(node.text)}, ${parentId});`)
  return buildJSXInsert(node, parentId, index, ctx)
}
const buildJSXInsert = (node, parentId, index, ctx) => {
  const { opts } = ctx
  const id = ctx.addId(parentId, "insert", index)
  const ins = compileSegments(node.code, opts)
  const range = `{ start: ${id}, end: ${id} }`
  ctx.addStatement(`${id} = Surplus.createTextNode('', ${parentId});`)
  ctx.addComputation([`Surplus.insert(__range, ${ins});`], "__range", range, node.loc)
}
const buildJSXContent = (node, parentId, ctx) => {
  const { opts } = ctx
  const content = compileSegments(node.code, opts)
  const dynamic = !noApparentSignals(content)
  if (dynamic) {
    ctx.addComputation([`Surplus.content(${parentId}, ${content}, __current);`], "__current", "''", node.loc)
  } else {
    ctx.addStatement(`Surplus.content(${parentId}, ${content}, "");`)
  }
}
const buildDOMExpressionAst = (topNode, opts) => {
  const ctx = {
    ids: [],
    statements: [],
    computations: [],
    opts,
    // Make context methods directly available if preferred, or pass ctx explicitly
    addId: function (parent, tag, n) {
      return addIdToContext(this, parent, tag, n)
    },
    addStatement: function (stmt) {
      return addStatementToContext(this, stmt)
    },
    addComputation: function (body, stateVar, seed, loc) {
      return addComputationToContext(this, body, stateVar, seed, loc)
    }
  }
  buildHtmlElementAst(topNode, "", 0, ctx)
  return new DOMExpression(ctx.ids, ctx.statements, ctx.computations)
}
const emitComputation = (comp, indentObj, opts) => {
  const { nli, nlii } = indentObj
  const { statements, loc, stateVar, seed } = comp
  const finalStatements = [...statements]
  if (stateVar && finalStatements.length > 0) {
    finalStatements[finalStatements.length - 1] = `return ${finalStatements[finalStatements.length - 1]}`
  }
  const body = finalStatements.length === 1 ? ` ${finalStatements[0]} ` : `${nlii}${finalStatements.join(nlii)}${nli}`
  const code = `Surplus.S.effect(function (${stateVar || ""}) {${body}}${seed !== null ? `, ${seed}` : ""});`
  return markLoc(code, loc, opts)
}
const emitDOMExpression = (domExpr, indentObj, opts) => {
  const { nl, nli } = indentObj
  const computationCode = domExpr.computations.map((comp) => emitComputation(comp, indentObj, opts)).join(nli)
  return `(function () {${nli}` + (domExpr.ids.length > 0 ? `var ${domExpr.ids.join(", ")};${nli}` : "") + domExpr.statements.join(nli) + (domExpr.statements.length > 0 && computationCode.length > 0 ? nli : "") + computationCode + (computationCode.length > 0 ? nli : "") + `return __;${nl}})()`
}
const compileHtmlElement = (node, indentObj, opts) => {
  const svg = node.kind === JSXElementKind.SVG
  if (node.fields.length === 0 && node.functions.length === 0 && node.content.length === 0) {
    const refs = node.references.map((r) => `${compileSegments(r.code, opts)} = `).join("")
    return `${refs}Surplus.create${svg ? "Svg" : ""}Element('${node.tag}', null, null)`
  }
  if (node.fields.length === 1 && isStaticClassField(node.fields[0], svg) && node.functions.length === 0 && node.content.length === 0) {
    const refs = node.references.map((r) => `${compileSegments(r.code, opts)} = `).join("")
    return `${refs}Surplus.create${svg ? "Svg" : ""}Element(${codeStr(node.tag)}, ${node.fields[0].value}, null)`
  }
  const domExprAst = buildDOMExpressionAst(node, opts)
  return emitDOMExpression(domExprAst, indentObj, opts)
}
const codeGen = (ctl, opts) => {
  return compileSegments(ctl, opts || {})
};

