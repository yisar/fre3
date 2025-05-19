package main

import (
	"fmt"
	"strconv"
	"strings"
	// "encoding/json"
	jsx "github.com/yisar/snel/jsx"
	ast "github.com/yisar/snel/ast"
)

type Printer struct {
	s strings.Builder
	pid int
	id int
}

var _ ast.Visitor = (*Printer)(nil)

func (p *Printer) VisitScript(s *ast.Script) {
	for _, fragment := range s.Body {
		fragment.Visit(p)

	}
}

func (p *Printer) VisitText(t *ast.Text) {
	
	if jsx.IsFunction(t.Value) {
		//signal
		p.s.WriteString(jsx.InsertSignal(p.pid,t.Value))
		
	}else if jsx.IsWhiteSpace(t.Value){}else{
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
	// p.s.WriteString("{")
	for _, frag := range e.Fragments {
		frag.Visit(p)
	}
	// p.s.WriteString("}")
}

func (p *Printer) VisitBoolValue(b *ast.BoolValue) {
	p.s.WriteString(strconv.Quote(strconv.FormatBool(b.Value)))
}

func (p *Printer) VisitElement(e *ast.Element) {
	pid:=p.pid

	if e.Name == ""{ // fragment
		// data, _ := json.MarshalIndent(e.Children, "", "  ")
		// 	fmt.Print(string(data))
		for _, child := range e.Children {
			child.Visit(p)
		}
		return
	}
	p.id++ //1

	if pid == 0{
		p.s.WriteString("(() => {")
	}
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

	if p.pid != 0{
		p.s.WriteString(jsx.AppendChild(p.pid, p.id))
	}

	for _, child := range e.Children {
		p.pid = p.id // 0
		child.Visit(p)
	}
	
	if pid == 0 {
			p.s.WriteString("return $el1;})();")
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
    <button onClick={() => setCount(count() + 1)}>
      <span>{count()}</span>
      {doubleCount()}
    </button>
  </>
}`
	ast, err := jsx.Parse("input.jsx", input)
	
	if err != nil{
		fmt.Println(err)
	}

	printer := &Printer{}
	ast.Visit(printer)
	actual := printer.String()
	fmt.Println(actual)
}
