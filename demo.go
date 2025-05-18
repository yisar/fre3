package main

import (
	"fmt"
	"strconv"
	"strings"
)

// --- Data Structures ---

// Attribute corresponds to the JavaScript attribute object
type Attribute struct {
	Name       string // In JS, sometimes 'key' for components, 'name' for elements
	Value      string
	Expression bool // True if value is a JS expression, false if string literal
	Dynamic    bool // True if this attribute can change and needs to be in update code
}

// Element corresponds to the JavaScript element object
type Element struct {
	Type       string
	Attributes []Attribute
	Children   []*Element // Use pointers for recursive structure and nil-ability

	// These fields are assigned during generation (like in the JS version)
	ElementID   int // Corresponds to 'element.element' in JS (an ID)
	ComponentID int // Corresponds to 'element.component' in JS (an ID)
}

// Root corresponds to the JavaScript root object, holding global state for generation
type Root struct {
	Element   *Element // The root element structure being processed
	ElementID int      // ID of the main mount point DOM element (JS: root.element)
	Next      int      // Counter for generating unique IDs (JS: root.next)
}

// --- Helper Functions ---

func getElement(elementID int) string {
	return "a" + strconv.Itoa(elementID)
}

func setElement(elementID int, code string) string {
	return getElement(elementID) + "=" + code
}

func createElement(elementType string) string {
	return `a.ce("` + elementType + `");`
}

func createTextNode(content string) string {
	// JS passes '""', so we want a.ctn("")
	// If content is already quoted, use as is.
	// The JS example `createTextNode('""')` means content is the string `""`
	// So if we pass `""` to this Go func, it becomes `a.ctn("");`
	return `a.ctn(` + content + `);`
}

func attributeValue(attribute Attribute) string {
	if attribute.Expression {
		return attribute.Value
	}
	return strconv.Quote(attribute.Value)
}

func setAttributeFunc(elementID int, attribute Attribute) string {
	return `a.sa(` + getElement(elementID) + `,"` + attribute.Name + `",` + attributeValue(attribute) + `);`
}

func addEventListener(elementID int, eventType string, handler string) string {
	return `a.ael(` + getElement(elementID) + `,"` + eventType + `",` + handler + `);`
}

func setTextContent(elementID int, content string) string {
	return `a.stc(` + getElement(elementID) + `,` + content + `);`
}

func appendChild(elementID, parentID int) string {
	return `a.ac(` + getElement(elementID) + `,` + getElement(parentID) + `);`
}

func removeChild(elementID, parentID int) string {
	return `a.rc(` + getElement(elementID) + `,` + getElement(parentID) + `);`
}

func insertBefore(elementID, referenceID, parentID int) string {
	return `a.ib(` + getElement(elementID) + `,` + getElement(referenceID) + `,` + getElement(parentID) + `);`
}

// generateMount: referenceID is a pointer to int, so it can be nil
func generateMount(elementID, parentID int, referenceID *int) string {
	if referenceID == nil {
		return appendChild(elementID, parentID)
	}
	return insertBefore(elementID, *referenceID, parentID)
}


func isComponent(elementType string) bool {
	if len(elementType) == 0 {
		return false
	}
	firstChar := rune(elementType[0])
	return firstChar >= 'A' && firstChar <= 'Z'
}

// --- Core Logic ---

// Corresponds to JS: let generateComponent = (element) => { ... }
// In JS, `attributes` and `parent.element` are accessed from the outer scope or via `element`.
// We need to pass `parent` and `root` explicitly.
func generateComponent(element *Element, parent *Element, root *Root) (string, string, string) {
	// element.ComponentID should have been set by the caller (generateAll)
	createCode := setElement(element.ComponentID, `new a.c.`+element.Type+`();`)
	var updateCodeBuilder strings.Builder
	dynamic := false

	// JS: `for (let i = 0; i < attributes.length; i++)`
	// Assuming `attributes` refers to `element.Attributes`
	// Also, JS uses `attribute.key` for components. We'll use `Attribute.Name` for this.
	for _, attribute := range element.Attributes {
		// In JS: `if (attribute.key[0] === '@')`
		// We use attribute.Name as the key here.
		if len(attribute.Name) > 0 && attribute.Name[0] == '@' {
			createCode += getElement(element.ComponentID) +
				`.on("` + attribute.Name[1:] +
				`",function($event){locals.$event=$event;` +
				attributeValue(attribute) + // attribute.Value should be the handler code
				`;});`
		} else {
			attributeCode := getElement(element.ComponentID) + `.` + attribute.Name + `=` + attributeValue(attribute) + `;`
			if attribute.Dynamic {
				dynamic = true
				updateCodeBuilder.WriteString(attributeCode)
			} else {
				createCode += attributeCode
			}
		}
	}

	createCode += getElement(element.ComponentID) + `.create(` + getElement(parent.ElementID) + `);`

	if dynamic {
		updateCodeBuilder.WriteString(getElement(element.ComponentID) + `.update();`)
	} else {
		createCode += getElement(element.ComponentID) + `.update();`
	}

	return createCode, updateCodeBuilder.String(), getElement(element.ComponentID) + `.destroy();`
}

// generateAll corresponds to the JS function.
// parent.element is parent.ElementID
// reference is an ID (or nil), so use *int
func generateAll(element *Element, parent *Element, root *Root, referenceID *int) (string, string, string) {
	switch element.Type {
	case "text":
		if len(element.Attributes) == 0 {
			// Should not happen for a valid text node based on JS logic
			return "", "", ""
		}
		textAttribute := element.Attributes[0]
		textNodeID := root.Next // JS: let textElement = root.next++
		root.Next++

		textCode := setTextContent(textNodeID, attributeValue(textAttribute))
		createCode := setElement(textNodeID, createTextNode(`""`)) // JS: createTextNode('""')
		updateCode := ""

		if textAttribute.Dynamic {
			updateCode += textCode
		} else {
			createCode += textCode
		}

		mountCode := generateMount(textNodeID, parent.ElementID, referenceID)
		destroyCode := removeChild(textNodeID, parent.ElementID)
		return createCode + mountCode, updateCode, destroyCode
	default:
		attributes := element.Attributes
		children := element.Children

		if isComponent(element.Type) {
			element.ComponentID = root.Next // JS: element.component = root.next++
			root.Next++
			return generateComponent(element, parent, root)
		}

		element.ElementID = root.Next // JS: element.element = root.next++
		root.Next++

		createCode := setElement(element.ElementID, createElement(element.Type))
		var updateCodeBuilder strings.Builder
		// var destroyCodeBuilder strings.Builder // Children's destroy code isn't aggregated this way in JS

		for _, attribute := range attributes {
			var attributeCode string // JS: let attributeCode = void 0

			if len(attribute.Name) > 0 && attribute.Name[0] == '@' {
				// attributeCode = "" // Not used directly
				eventType := attribute.Name[1:]
				// JS assumes 'instance' is available in the scope of the generated event handler
				eventHandler := `instance.` + attribute.Value + `($event)`
				createCode += addEventListener(element.ElementID, eventType, `function($event){`+eventHandler+`}`)
			} else {
				attributeCode = setAttributeFunc(element.ElementID, attribute)
			}

			if attribute.Dynamic {
				// Only add if it's not an event handler (which doesn't produce attributeCode for update)
				if !(len(attribute.Name) > 0 && attribute.Name[0] == '@') {
					updateCodeBuilder.WriteString(attributeCode)
				}
			} else {
				// Only add if it's not an event handler
				if !(len(attribute.Name) > 0 && attribute.Name[0] == '@') {
					createCode += attributeCode
				}
			}
		}

		for _, child := range children {
			// Children are always appended to the current element, so their reference is nil.
			childCreate, childUpdate, _ := generateAll(child, element, root, nil) // childDestroy is not used by parent in JS
			createCode += childCreate
			updateCodeBuilder.WriteString(childUpdate)
			// JS version adds childCode[2] (destroy) to its own destroy code, but it's not really used.
			// The parent's removeChild(element.element, parent.element) destroys all children.
		}

		mountCode := generateMount(element.ElementID, parent.ElementID, referenceID)
		destroyCode := removeChild(element.ElementID, parent.ElementID)

		return createCode + mountCode, updateCodeBuilder.String(), destroyCode
	}
}

// Generate is the main entry point, corresponding to JS 'generate'
// referenceID is the ID of the DOM element to insert before, can be nil.
func Generate(r *Root, referenceID *int) string {
	children := r.Element.Children // Children of the logical root element
	var createCodeBuilder, updateCodeBuilder, destroyCodeBuilder strings.Builder

	// This 'parent' represents the actual DOM element into which children will be mounted.
	// Its ID is r.ElementID.
	mountPointParent := &Element{ElementID: r.ElementID}

	for _, childElement := range children {
		// In JS: generateAll(children[i], root, root, reference)
		// `root` acts as `parent` (using `root.element` as parentId)
		// `root` acts as `root` (using `root.next` for ID generation)
		// `reference` is the initial reference for all top-level children.
		// This means if referenceID is not nil, children are inserted in reverse order
		// before the reference node. This behavior is preserved.
		genCreate, genUpdate, genDestroy := generateAll(childElement, mountPointParent, r, referenceID)
		createCodeBuilder.WriteString(genCreate)
		updateCodeBuilder.WriteString(genUpdate)
		destroyCodeBuilder.WriteString(genDestroy)
	}

	var preludeBuilder strings.Builder
	preludeBuilder.WriteString("let " + getElement(r.ElementID))
	// JS: for (let i$1 = root.element + 1; i$1 < root.next; i$1++)
	for i := r.ElementID + 1; i < r.Next; i++ {
		preludeBuilder.WriteString("," + getElement(i))
	}

	return preludeBuilder.String() +
		`;return [function($){` +
		setElement(r.ElementID, "$;") +
		createCodeBuilder.String() +
		`},function(){` +
		updateCodeBuilder.String() +
		`},function(){` +
		destroyCodeBuilder.String() +
		`}];`
}

// --- Example Usage (for testing) ---
func main() {
	// Define a sample element structure
	rootElement := &Element{
		Type: "div", // This is a logical root, its children go into the mount point
		Children: []*Element{
			{
				Type: "h1",
				Attributes: []Attribute{
					{Name: "class", Value: "title", Expression: false, Dynamic: false},
				},
				Children: []*Element{
					{
						Type: "text",
						Attributes: []Attribute{
							{Name: "textContent", Value: "Hello World", Expression: false, Dynamic: false},
						},
					},
				},
			},
			{
				Type: "p",
				Attributes: []Attribute{
					{Name: "id", Value: "dynamic-para", Expression: false, Dynamic: false},
				},
				Children: []*Element{
					{
						Type: "text",
						Attributes: []Attribute{
							// Example of a dynamic attribute value that's an expression
							{Name: "textContent", Value: "this.message", Expression: true, Dynamic: true},
						},
					},
				},
			},
			{
				Type: "MyComponent", // A component
				Attributes: []Attribute{
					{Name: "prop1", Value: "staticValue", Expression: false, Dynamic: false},
					{Name: "prop2", Value: "this.dynamicValue", Expression: true, Dynamic: true},
					{Name: "@event1", Value: "this.handleEvent1", Expression: true, Dynamic: false}, // Event handler code
				},
			},
			{
				Type: "button",
				Attributes: []Attribute{
					{Name: "@click", Value: "handleClick", Expression: false, Dynamic: false}, // Assumes handleClick is a method string
				},
				Children: []*Element{
					{
						Type: "text",
						Attributes: []Attribute{
							{Name: "textContent", Value: "Click Me", Expression: false, Dynamic: false},
						},
					},
				},
			},
		},
	}

	// Initialize the root state
	// root.element (JS) is the ID of the DOM element we are mounting to. Let's say it's 0.
	// root.next (JS) starts after root.element.
	rootState := &Root{
		Element:   rootElement,
		ElementID: 0,     // ID of the DOM mount point (e.g., the '$' passed to the create function)
		Next:      0 + 1, // Next available ID
	}

	// Generate code (reference is nil, so append)
	generatedJS := Generate(rootState, nil)
	fmt.Println(generatedJS)

	fmt.Println("\n--- With a reference ID ---")
	// Reset Next for a clean run if needed, or use a new Root object
	rootState.Next = rootState.ElementID + 1 
	refID := 99 // Some hypothetical reference element ID
	generatedJSWithRef := Generate(rootState, &refID)
	fmt.Println(generatedJSWithRef)
}