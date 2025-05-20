package main

import (
	"fmt"
	"strconv"
	"strings"

	ast "github.com/yisar/snel/ast"
	jsx "github.com/yisar/snel/jsx"
)

type Printer struct {
	s      strings.Builder
	pid    int
	id     int
	isJsx  bool
	isExpr bool
}

var _ ast.Visitor = (*Printer)(nil)

func (p *Printer) VisitScript(s *ast.Script) {
	for _, segment := range s.Body {
		segment.Visit(p)
	}
}

func (p *Printer) VisitText(t *ast.Text) {
	if jsx.IsWhiteSpace(t.Value) {
	} else if jsx.IsFunction(t.Value) { //signal
		p.s.WriteString(jsx.InsertSignal(p.pid, t.Value))
	} else if p.isExpr { // expr content
		p.s.WriteString(jsx.InsertContent(p.pid, t.Value))
	} else if p.isJsx { // textnode
		p.pid = p.id
		p.id++
		p.s.WriteString(`var `)
		p.s.WriteString(jsx.GetElement(p.id))
		p.s.WriteString(` = `)
		p.s.WriteString(jsx.CreateTextNode(`"` + t.Value + `"`))
		p.s.WriteString(jsx.AppendChild(p.pid, p.id))
	} else { // js text
		p.s.WriteString(t.Value)
	}
}

func (p *Printer) VisitComment(c *ast.Comment) {
	p.s.WriteString(c.String())
}

func (p *Printer) VisitField(f *ast.Field) {
	p.s.WriteString(jsx.SetProp(p.id, f.Name, f.Value.String()))
}

func (p *Printer) VisitStringValue(s *ast.StringValue) {
	p.s.WriteString(s.Value)
}

func (p *Printer) VisitExpr(e *ast.Expr) {
	p.isExpr = true
	// data, _ := json.MarshalIndent(e, "", "  ")
	// fmt.Print(string(data))
	for _, frag := range e.Segments {
		frag.Visit(p)
	}
	p.isExpr = false
}

func (p *Printer) VisitBoolValue(b *ast.BoolValue) {
	p.s.WriteString(strconv.Quote(strconv.FormatBool(b.Value)))
}

func (p *Printer) VisitElement(e *ast.Element) {
	if e.Name == "" { // segment
		for _, child := range e.Children {
			child.Visit(p)
		}
		return
	}
	pid := p.pid
	if pid == 0 {
		p.isJsx = true
		p.s.WriteString("(() => {")
	}
	p.id++
	id := p.id


	p.s.WriteString("var ")
	p.s.WriteString(jsx.GetElement(p.id))
	p.s.WriteString(" = ")
	p.s.WriteString(jsx.CreateElement(e.Name))
	if len(e.Attrs) > 0 {
		for i, attr := range e.Attrs {
			if i > 0 {
				p.s.WriteString(" ")
			}
			attr.Visit(p)
		}
	}

	if p.pid != 0 {
		p.s.WriteString(jsx.AppendChild(p.pid, p.id))
	}

	for _, child := range e.Children {
		p.pid = id
		child.Visit(p)
	}

	if pid == 0 {
		p.s.WriteString("return $el1;})();")
		p.isJsx = false
	}

}

func (p *Printer) String() string {
	return p.s.String()
}

func main() {
	input := `function Counter() {
  const count = signal(0)
  const doubleCount = computed(count() * 2)
  return <>
    <button onClick={() => count(count() + 1)}>
      <span>{count()}</span>
      {word}
    </button>
  </>
}`
	ast, err := jsx.Parse("input.jsx", input)

	if err != nil {
		fmt.Println(err)
	}

	printer := &Printer{}
	ast.Visit(printer)
	actual := printer.String()
	fmt.Println(actual)
}
