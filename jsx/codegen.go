package jsx
import (
	"strconv"
)

func GetElement(refId int) string {
	return "$el" + strconv.Itoa(refId)
}

func SetElement(refId int, code string) string {
	return GetElement(refId) + "=" + code
}

func CreateElement(tag string) string {
	return `$createElement("` + tag + `");`
}

func CreateTextNode(text string) string {
	return `$createTextNode(` + text + `);`
}

func AttributeValue(value string) string {
	if IsExpr(value){
		return value[1:len(value)-1]
	}else{
		return strconv.Quote(value[1:len(value)-1])
	}
}

func InsertSignal(refPid int, text string) string {
	return `$insertSignal(` + GetElement(refPid) + `,` + text[:len(text)-2] + `);`
}
func SetProp(refId int, attr string, value string) string {
	return `$setProp(` + GetElement(refId) + `,"` + attr + `",` + AttributeValue(value) + `);`
}

func AddEventListener(refId int, event string, handler string) string {
	return `$addEventListener(` + GetElement(refId) + `,"` + event + `",` + handler + `);`
}

func SetTextContent(refId int, text string) string {
	return `$setText(` + GetElement(refId) + `,` + text + `);`
}

func AppendChild(refId, parentId int) string {
	return `$insertNode(` + GetElement(refId) + `,` + GetElement(parentId) + `);`
}

func RemoveChild(refId, parentId int) string {
	return `$removeChild(` + GetElement(refId) + `,` + GetElement(parentId) + `);`
}

func InsertBefore(refId, nextId, parentId int) string {
	return `$insertNode(` + GetElement(refId) + `,` + GetElement(nextId) + `,` + GetElement(parentId) + `);`
}

func IsComponent(elementType string) bool {
	if len(elementType) == 0 {
		return false
	}
	firstChar := rune(elementType[0])
	return firstChar >= 'A' && firstChar <= 'Z'
}

func IsFunction(s string) bool { // isSignal
    return s[len(s)-2] == '(' && s[len(s)-1] == ')'
}

func IsExpr(s string) bool { // isSignal

    return s[0] == '{' && s[len(s)-1] == '}'
}

func IsWhiteSpace(s string) bool {
	for _, r := range s {
		// 检查每个字符：允许空格(ASCII 32)、回车(\r, ASCII 13)、换行(\n, ASCII 10)
		if r != ' ' && r != '\r' && r != '\n' {
			return false
		}
	}
	return true
}