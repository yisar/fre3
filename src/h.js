export const h = (type, props, ...kids) => {
  props = props || {}
  kids = flat(arrayfy(props.children || kids))

  if (kids.length) props.children = kids.length === 1 ? kids[0] : kids

  const key = props.key || null
  const ref = props.ref || null

  if (key) props.key = undefined
  if (ref) props.ref = undefined

  return createVnode(type, props, key, ref)
}

const some = (x) => x != null && x !== true && x !== false

const flat = (arr, target = []) => {
  arr.forEach(v => {
    isArr(v)
      ? flat(v, target)
      : some(v) && target.push(isStr(v) ? createText(v) : v)
  })
  return target
}

export const createVnode = (type, props, key, ref) => ({
  type,
  props,
  key,
  ref,
})

export const createText = (vnode) =>
  ({ type: '#text', props: { nodeValue: vnode + '' } })

export const isArr = Array.isArray