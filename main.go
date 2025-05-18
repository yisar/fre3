package main

import (
	"fmt"
	"strconv"
	"strings"
	jsx "github.com/yisar/snel/jsx"
	ast "github.com/yisar/snel/ast"
)

type Printer struct {
	s strings.Builder
	id int
}

var _ ast.Visitor = (*Printer)(nil)

func (p *Printer) VisitScript(s *ast.Script) {
	for _, fragment := range s.Body {
		fragment.Visit(p)
	}
}

func (p *Printer) VisitText(t *ast.Text) {
	p.s.WriteString(t.Value)
}

func (p *Printer) VisitComment(c *ast.Comment) {
	p.s.WriteString(c.String())
}

func (p *Printer) VisitField(f *ast.Field) {
	p.s.WriteString(jsx.SetProp(p.id, f.Name, f.Value.String()))
	p.s.WriteString("\n")
	// p.s.WriteString(f.Name)
	// p.s.WriteString("=")
	// f.Value.Visit(p)
}

func (p *Printer) VisitStringValue(s *ast.StringValue) {
	p.s.WriteString(s.Value)
}

func (p *Printer) VisitExpr(e *ast.Expr) {
	p.s.WriteString("{")
	for _, frag := range e.Fragments {
		frag.Visit(p)
	}
	p.s.WriteString("}")
}

func (p *Printer) VisitBoolValue(b *ast.BoolValue) {
	p.s.WriteString(strconv.Quote(strconv.FormatBool(b.Value)))
}

func (p *Printer) VisitElement(e *ast.Element) {
	p.s.WriteString("var ")
	p.s.WriteString(jsx.GetElement(p.id))
	p.s.WriteString(" = ")
	p.s.WriteString(jsx.CreateElement(e.Name))
	p.s.WriteString("\n")
	if len(e.Attrs) > 0 {
		for i, attr := range e.Attrs {
			if i > 0 {
				p.s.WriteString(" ")
			}
			attr.Visit(p)
		}
	}

	p.id++

	for _, child := range e.Children {
		child.Visit(p)
		// insertNode
		
	}

}

func (p *Printer) String() string {
	return p.s.String()
}

func main() {
	input := `export default () => <style scoped><Head/>{"body { background: blue }"}</style>`
	script, err := jsx.Parse("input.jsx", input)

	if err != nil{
		fmt.Println(err)
	}

	printer := &Printer{}
	script.Visit(printer)
	actual := printer.String()
	fmt.Println(actual)
}
