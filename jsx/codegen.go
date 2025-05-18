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
	return `$createText(` + text + `);`
}

func AttributeValue(attr string) string {
	return strconv.Quote(attr)
}

func SetProp(refId int, attr string, value string) string {
	return `$setProp(` + GetElement(refId) + `,"` + attr + `",` + value + `);`
}

func AddEventListener(refId int, event string, handler string) string {
	return `$addEventListener(` + GetElement(refId) + `,"` + event + `",` + handler + `);`
}

func SetTextContent(refId int, text string) string {
	return `$setText(` + GetElement(refId) + `,` + text + `);`
}

func AppendChild(refId, parentID int) string {
	return `$appendChild(` + GetElement(refId) + `,` + GetElement(parentID) + `);`
}

func RemoveChild(refId, parentID int) string {
	return `$removeChild(` + GetElement(refId) + `,` + GetElement(parentID) + `);`
}

func InsertBefore(refId, referenceID, parentID int) string {
	return `$insertBefore(` + GetElement(refId) + `,` + GetElement(referenceID) + `,` + GetElement(parentID) + `);`
}

func IsComponent(elementType string) bool {
	if len(elementType) == 0 {
		return false
	}
	firstChar := rune(elementType[0])
	return firstChar >= 'A' && firstChar <= 'Z'
}