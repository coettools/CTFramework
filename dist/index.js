(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["CTFramework"] = factory();
	else
		root["CTFramework"] = factory();
})(this, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/CTFramework.ts":
/*!****************************!*\
  !*** ./src/CTFramework.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CTFramework: () => (/* binding */ CTFramework),
/* harmony export */   createElement: () => (/* binding */ createElement)
/* harmony export */ });
function createElement(tag, props, ...children) {
    props = props || {};
    return {
        tag,
        props: Object.assign({}, props),
        children: children.flat(),
        key: (props === null || props === void 0 ? void 0 : props.key) || null,
    };
}
class CTFramework {
    // Render a component into a DOM container.
    static render(component, container) {
        const vnode = component.render(); // Generate the initial virtual node from the component's render method.
        vnode.component = component;
        component.vnode = vnode;
        const dom = CTFramework.createDom(vnode); // Create the actual DOM element from the virtual node.
        container.appendChild(dom); // Attach it to the container.
        CTFramework.onMount(vnode); // Trigger the component's mount lifecycle.
    }
    // Schedule updates to be processed in the next animation frame for better performance.
    static scheduleUpdate(updateFn) {
        CTFramework.pendingUpdates.push(updateFn);
        if (CTFramework.pendingUpdates.length === 1) {
            requestAnimationFrame(CTFramework.processUpdates);
        }
    }
    // Process all pending updates from the queue.
    static processUpdates() {
        while (CTFramework.pendingUpdates.length) {
            const updateFn = CTFramework.pendingUpdates.shift();
            updateFn && updateFn();
        }
    }
    // Re-render a component and update the DOM only if necessary.
    static rerender(component) {
        var _a, _b;
        if (!component.vnode)
            return;
        const oldVNode = component.vnode;
        if (!component.shouldComponentUpdate(component.props, component.state)) {
            return; // Skip re-render if shouldComponentUpdate returns false.
        }
        const newVNode = component.render(); // Render the updated virtual node.
        newVNode.component = component;
        const updatedDom = CTFramework.updateDom(oldVNode, newVNode); // Update the DOM.
        // Replace the DOM node if necessary.
        if (typeof oldVNode !== "string" && updatedDom !== oldVNode.dom && oldVNode.dom) {
            (_b = (_a = oldVNode.dom) === null || _a === void 0 ? void 0 : _a.parentNode) === null || _b === void 0 ? void 0 : _b.replaceChild(updatedDom, oldVNode.dom);
        }
        component.vnode = newVNode; // Store the new virtual node in the component.
        component.componentOnUpdate(component.props, component.state); // Trigger the update lifecycle.
    }
    // Create a DOM node from a virtual node.
    static createDom(vnode) {
        if (typeof vnode === "string" || typeof vnode === "number") {
            return document.createTextNode(String(vnode)); // Convert numbers to text nodes as well.
        }
        if (typeof vnode.tag === "function") {
            // Handle functional or class-based components.
            const ComponentClass = vnode.tag;
            const component = new ComponentClass(vnode.props);
            const componentVNode = component.render();
            componentVNode.component = component;
            vnode.component = component;
            component.vnode = componentVNode;
            const dom = CTFramework.createDom(componentVNode);
            vnode.dom = dom;
            component.componentOnMount();
            return dom;
        }
        const element = document.createElement(vnode.tag); // Create a DOM element for the tag.
        vnode.dom = element;
        // Event delegation: Attach a click-event attribute and store the event handler.
        // Check if the vnode has an onClick prop before adding the event handler
        if (vnode.props && vnode.props.onClick) {
            const oldEventId = element.getAttribute("click-event");
            if (oldEventId && CTFramework.eventHandlers[oldEventId]) {
                delete CTFramework.eventHandlers[oldEventId]; // Remove the old handler
            }
            // Only add the event listener and ID if the component has a click event
            element.setAttribute("click-event", guid());
            CTFramework.eventHandlers[element.getAttribute("click-event")] = vnode.props.onClick;
        }
        // Set properties and styles.
        CTFramework.updateDomProperties(element, {}, vnode.props);
        // Recursively create DOM for child nodes.
        vnode.children.forEach((child) => {
            const childDom = CTFramework.createDom(child);
            element.appendChild(childDom);
        });
        return element;
    }
    // Update the DOM by comparing the old and new virtual nodes.
    static updateDom(oldVNode, newVNode) {
        // Handle text nodes
        if (typeof oldVNode === "string" || typeof newVNode === "string") {
            const newTextContent = (typeof newVNode === "string" ? newVNode : "") || "";
            if (oldVNode !== newTextContent) {
                return document.createTextNode(newTextContent);
            }
            return typeof oldVNode === "string" ? document.createTextNode(oldVNode) : oldVNode.dom;
        }
        // Static node check remains
        if (oldVNode.isStatic) {
            newVNode.dom = oldVNode.dom;
            newVNode.component = oldVNode.component;
            return newVNode.dom;
        }
        // Replace node if tag is different
        if (oldVNode.tag !== newVNode.tag) {
            const newDom = CTFramework.createDom(newVNode);
            if (oldVNode.dom && oldVNode.dom.parentNode) {
                oldVNode.dom.parentNode.replaceChild(newDom, oldVNode.dom);
            }
            return newDom;
        }
        const dom = oldVNode.dom;
        newVNode.dom = dom;
        // **Ensure text content is updated**:
        // If we're dealing with text inside an element (like <h1>)
        if (newVNode.children.length === 1 && typeof newVNode.children[0] === "string") {
            if (dom.textContent !== newVNode.children[0]) {
                dom.textContent = newVNode.children[0]; // Update text directly
            }
        }
        // Update properties even if children haven't changed
        CTFramework.updateDomProperties(dom, oldVNode.props, newVNode.props);
        // Handle children updates (only if they exist)
        const oldChildren = oldVNode.children || [];
        const newChildren = newVNode.children || [];
        if (oldChildren.length === 0 && newChildren.length === 0) {
            return CTFramework.createDom(newVNode);
        }
        const oldChildrenMap = new Map();
        // Map old children by keys if any
        oldChildren.forEach((child) => {
            if (child && typeof child !== "string" && child.key) {
                oldChildrenMap.set(child.key, child); // **Track children by key**
            }
        });
        // **Iterate through new children**
        newChildren.forEach((newChild, i) => {
            if (typeof newChild === "string") {
                const newTextContent = newChild || "";
                const oldChild = oldChildren[i];
                if (typeof oldChild === "string" && oldChild !== newTextContent) {
                    // **Update text content if needed**
                    dom.childNodes[i].textContent = newTextContent;
                }
                else if (dom.childNodes[i]) {
                    dom.replaceChild(document.createTextNode(newTextContent), dom.childNodes[i]);
                }
                else {
                    dom.appendChild(document.createTextNode(newTextContent));
                }
            }
            else {
                const key = newChild.key;
                const oldChild = key ? oldChildrenMap.get(key) : oldChildren[i]; // **Look for matching old child by key or index**
                if (oldChild) {
                    // **Update the DOM for the matching child**
                    const updatedChildDom = CTFramework.updateDom(oldChild, newChild);
                    if (dom.childNodes[i] !== updatedChildDom) {
                        dom.replaceChild(updatedChildDom, dom.childNodes[i]);
                    }
                    if (key)
                        oldChildrenMap.delete(key); // **Remove key from map once updated**
                }
                else {
                    // **If no matching old child, create a new DOM node**
                    const newChildDom = CTFramework.createDom(newChild);
                    dom.appendChild(newChildDom);
                }
            }
        });
        // **Remove old children that are no longer present**
        oldChildrenMap.forEach((oldChild) => {
            if (oldChild.dom && dom.contains(oldChild.dom)) {
                dom.removeChild(oldChild.dom); // **Remove old DOM elements that are no longer in newVNode**
            }
        });
        return dom;
    }
    // Update the properties and styles of a DOM element.
    static updateDomProperties(dom, oldProps = {}, newProps = {}) {
        var _a;
        const changes = CTFramework.getPropChanges(oldProps, newProps);
        // Check if click-event exists on the DOM element, otherwise create one
        let eventId = (_a = dom.getAttribute("click-event")) !== null && _a !== void 0 ? _a : "";
        changes.forEach(({ name, value }) => {
            if (name === "style") {
                CTFramework.updateStyle(dom, oldProps.style, newProps.style);
            }
            else if (name.startsWith("on")) {
                const eventType = name.toLowerCase().substring(2);
                // Remove the old event listener from CTFramework.eventHandlers using click-event
                if (CTFramework.eventHandlers[eventId]) {
                    delete CTFramework.eventHandlers[eventId]; // Remove from event handlers map
                }
                // Add the new event listener in CTFramework.eventHandlers using click-event
                if (value && typeof value === "function") {
                    CTFramework.eventHandlers[eventId] = value; // Update the event handler in the map
                }
            }
            else if (name === "textContent") {
                dom.textContent = value;
            }
            else if (name in dom) {
                dom[name] = value;
            }
            else {
                dom.setAttribute(name, value);
            }
        });
    }
    // Get the differences between the old and new props for efficient updates.
    static getPropChanges(oldProps, newProps) {
        const changes = [];
        for (const name in newProps) {
            if (newProps[name] !== oldProps[name]) {
                changes.push({ name, value: newProps[name] });
            }
        }
        return changes;
    }
    // Add the missing updateStyle function.
    static updateStyle(dom, oldStyle = {}, newStyle = {}) {
        // If styles are provided as a string, update the style attribute.
        if (typeof oldStyle === "string" || typeof newStyle === "string") {
            dom.setAttribute("style", newStyle || "");
        }
        else {
            // Remove old styles not present in the new styles.
            Object.keys(oldStyle).forEach((key) => {
                if (!(key in newStyle)) {
                    dom.style[key] = "";
                }
            });
            // Apply new styles.
            Object.keys(newStyle).forEach((key) => {
                if (oldStyle[key] !== newStyle[key]) {
                    dom.style[key] = newStyle[key];
                }
            });
        }
    }
    // Helper method to handle the component mount lifecycle.
    static onMount(vnode) {
        if (typeof vnode === "string")
            return;
        if (vnode.component) {
            vnode.component.componentOnMount(); // Trigger component mount lifecycle.
        }
        vnode.children.forEach((child) => CTFramework.onMount(child));
    }
    // Helper method to handle the component unmount lifecycle.
    static onUnmount(vnode) {
        if (typeof vnode === "string")
            return;
        if (vnode.component) {
            vnode.component.componentOnUnmount(); // Trigger component unmount lifecycle.
        }
        vnode.children.forEach((child) => CTFramework.onUnmount(child));
    }
}
CTFramework.eventHandlers = {}; // Store event handlers by their unique event ID.
CTFramework.pendingUpdates = []; // Queue for pending updates to be processed.
function guid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
// Event delegation: A single event listener handles all click events.
document.addEventListener("click", (event) => {
    let target = event.target;
    while (target && !target.hasAttribute("click-event")) {
        target = target.parentElement;
    }
    if (target) {
        const handler = CTFramework.eventHandlers[target.getAttribute("click-event")];
        handler && handler(event);
    }
});


/***/ }),

/***/ "./src/Component.ts":
/*!**************************!*\
  !*** ./src/Component.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Component: () => (/* binding */ Component),
/* harmony export */   memo: () => (/* binding */ memo)
/* harmony export */ });
/* harmony import */ var _CTFramework__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./CTFramework */ "./src/CTFramework.ts");

// Component class representing a UI component with state and lifecycle management.
class Component {
    constructor(props) {
        this.vnode = null;
        this.props = props;
        this.state = {};
    }
    // Set a new state and schedule a re-render if necessary.
    setState(newState) {
        const prevState = this.state;
        this.state = Object.assign(Object.assign({}, this.state), newState);
        // Schedule a re-render asynchronously.
        Promise.resolve().then(() => {
            if (this.vnode && this.shouldComponentUpdate(this.props, prevState)) {
                // Use CTFramework's rerender method to update the DOM
                _CTFramework__WEBPACK_IMPORTED_MODULE_0__.CTFramework.rerender(this);
            }
        });
    }
    // Method to control whether a component should re-render.
    // Override this method in individual components if specific checks are needed.
    shouldComponentUpdate(nextProps, nextState) {
        return true; // Default behavior is to always re-render.
    }
    // Render method must be implemented by any class extending Component.
    render() {
        throw new Error(`Render method must be implemented in the component ${this.constructor.name}`);
    }
    // Lifecycle methods, which can be overridden by components.
    componentOnMount() { }
    componentOnUpdate(prevProps, prevState) { }
    componentOnUnmount() { }
    componentOnCatch(error, info) { }
}
// Memoization helper function for components.
// It prevents unnecessary re-renders by checking if the props have changed.
function memo(ComponentClass) {
    return class MemoizedComponent extends Component {
        shouldComponentUpdate(nextProps) {
            return shallowCompare(this.props, nextProps); // Use shallow comparison of props to prevent re-rendering.
        }
        // Forward the render method from the original component class
        render() {
            return new ComponentClass(this.props).render();
        }
    };
}
// A shallow comparison function to check if two objects are different.
function shallowCompare(obj1, obj2) {
    for (const key in obj1) {
        if (obj1[key] !== obj2[key])
            return true;
    }
    return false;
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Component: () => (/* reexport safe */ _Component__WEBPACK_IMPORTED_MODULE_0__.Component),
/* harmony export */   createElement: () => (/* reexport safe */ _CTFramework__WEBPACK_IMPORTED_MODULE_1__.createElement),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   memo: () => (/* reexport safe */ _Component__WEBPACK_IMPORTED_MODULE_0__.memo)
/* harmony export */ });
/* harmony import */ var _Component__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Component */ "./src/Component.ts");
/* harmony import */ var _CTFramework__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./CTFramework */ "./src/CTFramework.ts");
/// <reference path="./jsx.d.ts" />



/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_CTFramework__WEBPACK_IMPORTED_MODULE_1__.CTFramework);

__webpack_exports__ = __webpack_exports__.CTFramework;
/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7OztBQzVSMkM7QUFDNUM7QUFDTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtREFBbUQ7QUFDbkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnQkFBZ0IscURBQVc7QUFDM0I7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0EsOEVBQThFLHNCQUFzQjtBQUNwRztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDTztBQUNQO0FBQ0E7QUFDQSwwREFBMEQ7QUFDMUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7O1VDdkRBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7O1dDdEJBO1dBQ0E7V0FDQTtXQUNBO1dBQ0EseUNBQXlDLHdDQUF3QztXQUNqRjtXQUNBO1dBQ0E7Ozs7O1dDUEE7Ozs7O1dDQUE7V0FDQTtXQUNBO1dBQ0EsdURBQXVELGlCQUFpQjtXQUN4RTtXQUNBLGdEQUFnRCxhQUFhO1dBQzdEOzs7Ozs7Ozs7Ozs7Ozs7OztBQ05BO0FBQzhDO0FBQ2E7QUFDakI7QUFDMUMsaUVBQWUscURBQVcsRUFBQyIsInNvdXJjZXMiOlsid2VicGFjazovL0NURnJhbWV3b3JrL3dlYnBhY2svdW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvbiIsIndlYnBhY2s6Ly9DVEZyYW1ld29yay8uL3NyYy9DVEZyYW1ld29yay50cyIsIndlYnBhY2s6Ly9DVEZyYW1ld29yay8uL3NyYy9Db21wb25lbnQudHMiLCJ3ZWJwYWNrOi8vQ1RGcmFtZXdvcmsvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vQ1RGcmFtZXdvcmsvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL0NURnJhbWV3b3JrL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vQ1RGcmFtZXdvcmsvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9DVEZyYW1ld29yay8uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gd2VicGFja1VuaXZlcnNhbE1vZHVsZURlZmluaXRpb24ocm9vdCwgZmFjdG9yeSkge1xuXHRpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcpXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG5cdGVsc2UgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKVxuXHRcdGRlZmluZShbXSwgZmFjdG9yeSk7XG5cdGVsc2UgaWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKVxuXHRcdGV4cG9ydHNbXCJDVEZyYW1ld29ya1wiXSA9IGZhY3RvcnkoKTtcblx0ZWxzZVxuXHRcdHJvb3RbXCJDVEZyYW1ld29ya1wiXSA9IGZhY3RvcnkoKTtcbn0pKHRoaXMsICgpID0+IHtcbnJldHVybiAiLCJleHBvcnQgZnVuY3Rpb24gY3JlYXRlRWxlbWVudCh0YWcsIHByb3BzLCAuLi5jaGlsZHJlbikge1xuICAgIHByb3BzID0gcHJvcHMgfHwge307XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGFnLFxuICAgICAgICBwcm9wczogT2JqZWN0LmFzc2lnbih7fSwgcHJvcHMpLFxuICAgICAgICBjaGlsZHJlbjogY2hpbGRyZW4uZmxhdCgpLFxuICAgICAgICBrZXk6IChwcm9wcyA9PT0gbnVsbCB8fCBwcm9wcyA9PT0gdm9pZCAwID8gdm9pZCAwIDogcHJvcHMua2V5KSB8fCBudWxsLFxuICAgIH07XG59XG5leHBvcnQgY2xhc3MgQ1RGcmFtZXdvcmsge1xuICAgIC8vIFJlbmRlciBhIGNvbXBvbmVudCBpbnRvIGEgRE9NIGNvbnRhaW5lci5cbiAgICBzdGF0aWMgcmVuZGVyKGNvbXBvbmVudCwgY29udGFpbmVyKSB7XG4gICAgICAgIGNvbnN0IHZub2RlID0gY29tcG9uZW50LnJlbmRlcigpOyAvLyBHZW5lcmF0ZSB0aGUgaW5pdGlhbCB2aXJ0dWFsIG5vZGUgZnJvbSB0aGUgY29tcG9uZW50J3MgcmVuZGVyIG1ldGhvZC5cbiAgICAgICAgdm5vZGUuY29tcG9uZW50ID0gY29tcG9uZW50O1xuICAgICAgICBjb21wb25lbnQudm5vZGUgPSB2bm9kZTtcbiAgICAgICAgY29uc3QgZG9tID0gQ1RGcmFtZXdvcmsuY3JlYXRlRG9tKHZub2RlKTsgLy8gQ3JlYXRlIHRoZSBhY3R1YWwgRE9NIGVsZW1lbnQgZnJvbSB0aGUgdmlydHVhbCBub2RlLlxuICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoZG9tKTsgLy8gQXR0YWNoIGl0IHRvIHRoZSBjb250YWluZXIuXG4gICAgICAgIENURnJhbWV3b3JrLm9uTW91bnQodm5vZGUpOyAvLyBUcmlnZ2VyIHRoZSBjb21wb25lbnQncyBtb3VudCBsaWZlY3ljbGUuXG4gICAgfVxuICAgIC8vIFNjaGVkdWxlIHVwZGF0ZXMgdG8gYmUgcHJvY2Vzc2VkIGluIHRoZSBuZXh0IGFuaW1hdGlvbiBmcmFtZSBmb3IgYmV0dGVyIHBlcmZvcm1hbmNlLlxuICAgIHN0YXRpYyBzY2hlZHVsZVVwZGF0ZSh1cGRhdGVGbikge1xuICAgICAgICBDVEZyYW1ld29yay5wZW5kaW5nVXBkYXRlcy5wdXNoKHVwZGF0ZUZuKTtcbiAgICAgICAgaWYgKENURnJhbWV3b3JrLnBlbmRpbmdVcGRhdGVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKENURnJhbWV3b3JrLnByb2Nlc3NVcGRhdGVzKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyBQcm9jZXNzIGFsbCBwZW5kaW5nIHVwZGF0ZXMgZnJvbSB0aGUgcXVldWUuXG4gICAgc3RhdGljIHByb2Nlc3NVcGRhdGVzKCkge1xuICAgICAgICB3aGlsZSAoQ1RGcmFtZXdvcmsucGVuZGluZ1VwZGF0ZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb25zdCB1cGRhdGVGbiA9IENURnJhbWV3b3JrLnBlbmRpbmdVcGRhdGVzLnNoaWZ0KCk7XG4gICAgICAgICAgICB1cGRhdGVGbiAmJiB1cGRhdGVGbigpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIFJlLXJlbmRlciBhIGNvbXBvbmVudCBhbmQgdXBkYXRlIHRoZSBET00gb25seSBpZiBuZWNlc3NhcnkuXG4gICAgc3RhdGljIHJlcmVuZGVyKGNvbXBvbmVudCkge1xuICAgICAgICB2YXIgX2EsIF9iO1xuICAgICAgICBpZiAoIWNvbXBvbmVudC52bm9kZSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3Qgb2xkVk5vZGUgPSBjb21wb25lbnQudm5vZGU7XG4gICAgICAgIGlmICghY29tcG9uZW50LnNob3VsZENvbXBvbmVudFVwZGF0ZShjb21wb25lbnQucHJvcHMsIGNvbXBvbmVudC5zdGF0ZSkpIHtcbiAgICAgICAgICAgIHJldHVybjsgLy8gU2tpcCByZS1yZW5kZXIgaWYgc2hvdWxkQ29tcG9uZW50VXBkYXRlIHJldHVybnMgZmFsc2UuXG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbmV3Vk5vZGUgPSBjb21wb25lbnQucmVuZGVyKCk7IC8vIFJlbmRlciB0aGUgdXBkYXRlZCB2aXJ0dWFsIG5vZGUuXG4gICAgICAgIG5ld1ZOb2RlLmNvbXBvbmVudCA9IGNvbXBvbmVudDtcbiAgICAgICAgY29uc3QgdXBkYXRlZERvbSA9IENURnJhbWV3b3JrLnVwZGF0ZURvbShvbGRWTm9kZSwgbmV3Vk5vZGUpOyAvLyBVcGRhdGUgdGhlIERPTS5cbiAgICAgICAgLy8gUmVwbGFjZSB0aGUgRE9NIG5vZGUgaWYgbmVjZXNzYXJ5LlxuICAgICAgICBpZiAodHlwZW9mIG9sZFZOb2RlICE9PSBcInN0cmluZ1wiICYmIHVwZGF0ZWREb20gIT09IG9sZFZOb2RlLmRvbSAmJiBvbGRWTm9kZS5kb20pIHtcbiAgICAgICAgICAgIChfYiA9IChfYSA9IG9sZFZOb2RlLmRvbSkgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLnBhcmVudE5vZGUpID09PSBudWxsIHx8IF9iID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYi5yZXBsYWNlQ2hpbGQodXBkYXRlZERvbSwgb2xkVk5vZGUuZG9tKTtcbiAgICAgICAgfVxuICAgICAgICBjb21wb25lbnQudm5vZGUgPSBuZXdWTm9kZTsgLy8gU3RvcmUgdGhlIG5ldyB2aXJ0dWFsIG5vZGUgaW4gdGhlIGNvbXBvbmVudC5cbiAgICAgICAgY29tcG9uZW50LmNvbXBvbmVudE9uVXBkYXRlKGNvbXBvbmVudC5wcm9wcywgY29tcG9uZW50LnN0YXRlKTsgLy8gVHJpZ2dlciB0aGUgdXBkYXRlIGxpZmVjeWNsZS5cbiAgICB9XG4gICAgLy8gQ3JlYXRlIGEgRE9NIG5vZGUgZnJvbSBhIHZpcnR1YWwgbm9kZS5cbiAgICBzdGF0aWMgY3JlYXRlRG9tKHZub2RlKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygdm5vZGUgPT09IFwic3RyaW5nXCIgfHwgdHlwZW9mIHZub2RlID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoU3RyaW5nKHZub2RlKSk7IC8vIENvbnZlcnQgbnVtYmVycyB0byB0ZXh0IG5vZGVzIGFzIHdlbGwuXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiB2bm9kZS50YWcgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgLy8gSGFuZGxlIGZ1bmN0aW9uYWwgb3IgY2xhc3MtYmFzZWQgY29tcG9uZW50cy5cbiAgICAgICAgICAgIGNvbnN0IENvbXBvbmVudENsYXNzID0gdm5vZGUudGFnO1xuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50ID0gbmV3IENvbXBvbmVudENsYXNzKHZub2RlLnByb3BzKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudFZOb2RlID0gY29tcG9uZW50LnJlbmRlcigpO1xuICAgICAgICAgICAgY29tcG9uZW50Vk5vZGUuY29tcG9uZW50ID0gY29tcG9uZW50O1xuICAgICAgICAgICAgdm5vZGUuY29tcG9uZW50ID0gY29tcG9uZW50O1xuICAgICAgICAgICAgY29tcG9uZW50LnZub2RlID0gY29tcG9uZW50Vk5vZGU7XG4gICAgICAgICAgICBjb25zdCBkb20gPSBDVEZyYW1ld29yay5jcmVhdGVEb20oY29tcG9uZW50Vk5vZGUpO1xuICAgICAgICAgICAgdm5vZGUuZG9tID0gZG9tO1xuICAgICAgICAgICAgY29tcG9uZW50LmNvbXBvbmVudE9uTW91bnQoKTtcbiAgICAgICAgICAgIHJldHVybiBkb207XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodm5vZGUudGFnKTsgLy8gQ3JlYXRlIGEgRE9NIGVsZW1lbnQgZm9yIHRoZSB0YWcuXG4gICAgICAgIHZub2RlLmRvbSA9IGVsZW1lbnQ7XG4gICAgICAgIC8vIEV2ZW50IGRlbGVnYXRpb246IEF0dGFjaCBhIGNsaWNrLWV2ZW50IGF0dHJpYnV0ZSBhbmQgc3RvcmUgdGhlIGV2ZW50IGhhbmRsZXIuXG4gICAgICAgIC8vIENoZWNrIGlmIHRoZSB2bm9kZSBoYXMgYW4gb25DbGljayBwcm9wIGJlZm9yZSBhZGRpbmcgdGhlIGV2ZW50IGhhbmRsZXJcbiAgICAgICAgaWYgKHZub2RlLnByb3BzICYmIHZub2RlLnByb3BzLm9uQ2xpY2spIHtcbiAgICAgICAgICAgIGNvbnN0IG9sZEV2ZW50SWQgPSBlbGVtZW50LmdldEF0dHJpYnV0ZShcImNsaWNrLWV2ZW50XCIpO1xuICAgICAgICAgICAgaWYgKG9sZEV2ZW50SWQgJiYgQ1RGcmFtZXdvcmsuZXZlbnRIYW5kbGVyc1tvbGRFdmVudElkXSkge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBDVEZyYW1ld29yay5ldmVudEhhbmRsZXJzW29sZEV2ZW50SWRdOyAvLyBSZW1vdmUgdGhlIG9sZCBoYW5kbGVyXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBPbmx5IGFkZCB0aGUgZXZlbnQgbGlzdGVuZXIgYW5kIElEIGlmIHRoZSBjb21wb25lbnQgaGFzIGEgY2xpY2sgZXZlbnRcbiAgICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwiY2xpY2stZXZlbnRcIiwgZ3VpZCgpKTtcbiAgICAgICAgICAgIENURnJhbWV3b3JrLmV2ZW50SGFuZGxlcnNbZWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJjbGljay1ldmVudFwiKV0gPSB2bm9kZS5wcm9wcy5vbkNsaWNrO1xuICAgICAgICB9XG4gICAgICAgIC8vIFNldCBwcm9wZXJ0aWVzIGFuZCBzdHlsZXMuXG4gICAgICAgIENURnJhbWV3b3JrLnVwZGF0ZURvbVByb3BlcnRpZXMoZWxlbWVudCwge30sIHZub2RlLnByb3BzKTtcbiAgICAgICAgLy8gUmVjdXJzaXZlbHkgY3JlYXRlIERPTSBmb3IgY2hpbGQgbm9kZXMuXG4gICAgICAgIHZub2RlLmNoaWxkcmVuLmZvckVhY2goKGNoaWxkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjaGlsZERvbSA9IENURnJhbWV3b3JrLmNyZWF0ZURvbShjaGlsZCk7XG4gICAgICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKGNoaWxkRG9tKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIH1cbiAgICAvLyBVcGRhdGUgdGhlIERPTSBieSBjb21wYXJpbmcgdGhlIG9sZCBhbmQgbmV3IHZpcnR1YWwgbm9kZXMuXG4gICAgc3RhdGljIHVwZGF0ZURvbShvbGRWTm9kZSwgbmV3Vk5vZGUpIHtcbiAgICAgICAgLy8gSGFuZGxlIHRleHQgbm9kZXNcbiAgICAgICAgaWYgKHR5cGVvZiBvbGRWTm9kZSA9PT0gXCJzdHJpbmdcIiB8fCB0eXBlb2YgbmV3Vk5vZGUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIGNvbnN0IG5ld1RleHRDb250ZW50ID0gKHR5cGVvZiBuZXdWTm9kZSA9PT0gXCJzdHJpbmdcIiA/IG5ld1ZOb2RlIDogXCJcIikgfHwgXCJcIjtcbiAgICAgICAgICAgIGlmIChvbGRWTm9kZSAhPT0gbmV3VGV4dENvbnRlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUobmV3VGV4dENvbnRlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiBvbGRWTm9kZSA9PT0gXCJzdHJpbmdcIiA/IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKG9sZFZOb2RlKSA6IG9sZFZOb2RlLmRvbTtcbiAgICAgICAgfVxuICAgICAgICAvLyBTdGF0aWMgbm9kZSBjaGVjayByZW1haW5zXG4gICAgICAgIGlmIChvbGRWTm9kZS5pc1N0YXRpYykge1xuICAgICAgICAgICAgbmV3Vk5vZGUuZG9tID0gb2xkVk5vZGUuZG9tO1xuICAgICAgICAgICAgbmV3Vk5vZGUuY29tcG9uZW50ID0gb2xkVk5vZGUuY29tcG9uZW50O1xuICAgICAgICAgICAgcmV0dXJuIG5ld1ZOb2RlLmRvbTtcbiAgICAgICAgfVxuICAgICAgICAvLyBSZXBsYWNlIG5vZGUgaWYgdGFnIGlzIGRpZmZlcmVudFxuICAgICAgICBpZiAob2xkVk5vZGUudGFnICE9PSBuZXdWTm9kZS50YWcpIHtcbiAgICAgICAgICAgIGNvbnN0IG5ld0RvbSA9IENURnJhbWV3b3JrLmNyZWF0ZURvbShuZXdWTm9kZSk7XG4gICAgICAgICAgICBpZiAob2xkVk5vZGUuZG9tICYmIG9sZFZOb2RlLmRvbS5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgICAgICAgb2xkVk5vZGUuZG9tLnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKG5ld0RvbSwgb2xkVk5vZGUuZG9tKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuZXdEb207XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZG9tID0gb2xkVk5vZGUuZG9tO1xuICAgICAgICBuZXdWTm9kZS5kb20gPSBkb207XG4gICAgICAgIC8vICoqRW5zdXJlIHRleHQgY29udGVudCBpcyB1cGRhdGVkKio6XG4gICAgICAgIC8vIElmIHdlJ3JlIGRlYWxpbmcgd2l0aCB0ZXh0IGluc2lkZSBhbiBlbGVtZW50IChsaWtlIDxoMT4pXG4gICAgICAgIGlmIChuZXdWTm9kZS5jaGlsZHJlbi5sZW5ndGggPT09IDEgJiYgdHlwZW9mIG5ld1ZOb2RlLmNoaWxkcmVuWzBdID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBpZiAoZG9tLnRleHRDb250ZW50ICE9PSBuZXdWTm9kZS5jaGlsZHJlblswXSkge1xuICAgICAgICAgICAgICAgIGRvbS50ZXh0Q29udGVudCA9IG5ld1ZOb2RlLmNoaWxkcmVuWzBdOyAvLyBVcGRhdGUgdGV4dCBkaXJlY3RseVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIFVwZGF0ZSBwcm9wZXJ0aWVzIGV2ZW4gaWYgY2hpbGRyZW4gaGF2ZW4ndCBjaGFuZ2VkXG4gICAgICAgIENURnJhbWV3b3JrLnVwZGF0ZURvbVByb3BlcnRpZXMoZG9tLCBvbGRWTm9kZS5wcm9wcywgbmV3Vk5vZGUucHJvcHMpO1xuICAgICAgICAvLyBIYW5kbGUgY2hpbGRyZW4gdXBkYXRlcyAob25seSBpZiB0aGV5IGV4aXN0KVxuICAgICAgICBjb25zdCBvbGRDaGlsZHJlbiA9IG9sZFZOb2RlLmNoaWxkcmVuIHx8IFtdO1xuICAgICAgICBjb25zdCBuZXdDaGlsZHJlbiA9IG5ld1ZOb2RlLmNoaWxkcmVuIHx8IFtdO1xuICAgICAgICBpZiAob2xkQ2hpbGRyZW4ubGVuZ3RoID09PSAwICYmIG5ld0NoaWxkcmVuLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIENURnJhbWV3b3JrLmNyZWF0ZURvbShuZXdWTm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgb2xkQ2hpbGRyZW5NYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgIC8vIE1hcCBvbGQgY2hpbGRyZW4gYnkga2V5cyBpZiBhbnlcbiAgICAgICAgb2xkQ2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQpID0+IHtcbiAgICAgICAgICAgIGlmIChjaGlsZCAmJiB0eXBlb2YgY2hpbGQgIT09IFwic3RyaW5nXCIgJiYgY2hpbGQua2V5KSB7XG4gICAgICAgICAgICAgICAgb2xkQ2hpbGRyZW5NYXAuc2V0KGNoaWxkLmtleSwgY2hpbGQpOyAvLyAqKlRyYWNrIGNoaWxkcmVuIGJ5IGtleSoqXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAvLyAqKkl0ZXJhdGUgdGhyb3VnaCBuZXcgY2hpbGRyZW4qKlxuICAgICAgICBuZXdDaGlsZHJlbi5mb3JFYWNoKChuZXdDaGlsZCwgaSkgPT4ge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBuZXdDaGlsZCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5ld1RleHRDb250ZW50ID0gbmV3Q2hpbGQgfHwgXCJcIjtcbiAgICAgICAgICAgICAgICBjb25zdCBvbGRDaGlsZCA9IG9sZENoaWxkcmVuW2ldO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygb2xkQ2hpbGQgPT09IFwic3RyaW5nXCIgJiYgb2xkQ2hpbGQgIT09IG5ld1RleHRDb250ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vICoqVXBkYXRlIHRleHQgY29udGVudCBpZiBuZWVkZWQqKlxuICAgICAgICAgICAgICAgICAgICBkb20uY2hpbGROb2Rlc1tpXS50ZXh0Q29udGVudCA9IG5ld1RleHRDb250ZW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChkb20uY2hpbGROb2Rlc1tpXSkge1xuICAgICAgICAgICAgICAgICAgICBkb20ucmVwbGFjZUNoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKG5ld1RleHRDb250ZW50KSwgZG9tLmNoaWxkTm9kZXNbaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZG9tLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKG5ld1RleHRDb250ZW50KSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3Qga2V5ID0gbmV3Q2hpbGQua2V5O1xuICAgICAgICAgICAgICAgIGNvbnN0IG9sZENoaWxkID0ga2V5ID8gb2xkQ2hpbGRyZW5NYXAuZ2V0KGtleSkgOiBvbGRDaGlsZHJlbltpXTsgLy8gKipMb29rIGZvciBtYXRjaGluZyBvbGQgY2hpbGQgYnkga2V5IG9yIGluZGV4KipcbiAgICAgICAgICAgICAgICBpZiAob2xkQ2hpbGQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gKipVcGRhdGUgdGhlIERPTSBmb3IgdGhlIG1hdGNoaW5nIGNoaWxkKipcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdXBkYXRlZENoaWxkRG9tID0gQ1RGcmFtZXdvcmsudXBkYXRlRG9tKG9sZENoaWxkLCBuZXdDaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkb20uY2hpbGROb2Rlc1tpXSAhPT0gdXBkYXRlZENoaWxkRG9tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb20ucmVwbGFjZUNoaWxkKHVwZGF0ZWRDaGlsZERvbSwgZG9tLmNoaWxkTm9kZXNbaV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChrZXkpXG4gICAgICAgICAgICAgICAgICAgICAgICBvbGRDaGlsZHJlbk1hcC5kZWxldGUoa2V5KTsgLy8gKipSZW1vdmUga2V5IGZyb20gbWFwIG9uY2UgdXBkYXRlZCoqXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyAqKklmIG5vIG1hdGNoaW5nIG9sZCBjaGlsZCwgY3JlYXRlIGEgbmV3IERPTSBub2RlKipcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbmV3Q2hpbGREb20gPSBDVEZyYW1ld29yay5jcmVhdGVEb20obmV3Q2hpbGQpO1xuICAgICAgICAgICAgICAgICAgICBkb20uYXBwZW5kQ2hpbGQobmV3Q2hpbGREb20pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIC8vICoqUmVtb3ZlIG9sZCBjaGlsZHJlbiB0aGF0IGFyZSBubyBsb25nZXIgcHJlc2VudCoqXG4gICAgICAgIG9sZENoaWxkcmVuTWFwLmZvckVhY2goKG9sZENoaWxkKSA9PiB7XG4gICAgICAgICAgICBpZiAob2xkQ2hpbGQuZG9tICYmIGRvbS5jb250YWlucyhvbGRDaGlsZC5kb20pKSB7XG4gICAgICAgICAgICAgICAgZG9tLnJlbW92ZUNoaWxkKG9sZENoaWxkLmRvbSk7IC8vICoqUmVtb3ZlIG9sZCBET00gZWxlbWVudHMgdGhhdCBhcmUgbm8gbG9uZ2VyIGluIG5ld1ZOb2RlKipcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBkb207XG4gICAgfVxuICAgIC8vIFVwZGF0ZSB0aGUgcHJvcGVydGllcyBhbmQgc3R5bGVzIG9mIGEgRE9NIGVsZW1lbnQuXG4gICAgc3RhdGljIHVwZGF0ZURvbVByb3BlcnRpZXMoZG9tLCBvbGRQcm9wcyA9IHt9LCBuZXdQcm9wcyA9IHt9KSB7XG4gICAgICAgIHZhciBfYTtcbiAgICAgICAgY29uc3QgY2hhbmdlcyA9IENURnJhbWV3b3JrLmdldFByb3BDaGFuZ2VzKG9sZFByb3BzLCBuZXdQcm9wcyk7XG4gICAgICAgIC8vIENoZWNrIGlmIGNsaWNrLWV2ZW50IGV4aXN0cyBvbiB0aGUgRE9NIGVsZW1lbnQsIG90aGVyd2lzZSBjcmVhdGUgb25lXG4gICAgICAgIGxldCBldmVudElkID0gKF9hID0gZG9tLmdldEF0dHJpYnV0ZShcImNsaWNrLWV2ZW50XCIpKSAhPT0gbnVsbCAmJiBfYSAhPT0gdm9pZCAwID8gX2EgOiBcIlwiO1xuICAgICAgICBjaGFuZ2VzLmZvckVhY2goKHsgbmFtZSwgdmFsdWUgfSkgPT4ge1xuICAgICAgICAgICAgaWYgKG5hbWUgPT09IFwic3R5bGVcIikge1xuICAgICAgICAgICAgICAgIENURnJhbWV3b3JrLnVwZGF0ZVN0eWxlKGRvbSwgb2xkUHJvcHMuc3R5bGUsIG5ld1Byb3BzLnN0eWxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKG5hbWUuc3RhcnRzV2l0aChcIm9uXCIpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZXZlbnRUeXBlID0gbmFtZS50b0xvd2VyQ2FzZSgpLnN1YnN0cmluZygyKTtcbiAgICAgICAgICAgICAgICAvLyBSZW1vdmUgdGhlIG9sZCBldmVudCBsaXN0ZW5lciBmcm9tIENURnJhbWV3b3JrLmV2ZW50SGFuZGxlcnMgdXNpbmcgY2xpY2stZXZlbnRcbiAgICAgICAgICAgICAgICBpZiAoQ1RGcmFtZXdvcmsuZXZlbnRIYW5kbGVyc1tldmVudElkXSkge1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgQ1RGcmFtZXdvcmsuZXZlbnRIYW5kbGVyc1tldmVudElkXTsgLy8gUmVtb3ZlIGZyb20gZXZlbnQgaGFuZGxlcnMgbWFwXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIEFkZCB0aGUgbmV3IGV2ZW50IGxpc3RlbmVyIGluIENURnJhbWV3b3JrLmV2ZW50SGFuZGxlcnMgdXNpbmcgY2xpY2stZXZlbnRcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgQ1RGcmFtZXdvcmsuZXZlbnRIYW5kbGVyc1tldmVudElkXSA9IHZhbHVlOyAvLyBVcGRhdGUgdGhlIGV2ZW50IGhhbmRsZXIgaW4gdGhlIG1hcFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKG5hbWUgPT09IFwidGV4dENvbnRlbnRcIikge1xuICAgICAgICAgICAgICAgIGRvbS50ZXh0Q29udGVudCA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAobmFtZSBpbiBkb20pIHtcbiAgICAgICAgICAgICAgICBkb21bbmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGRvbS5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgLy8gR2V0IHRoZSBkaWZmZXJlbmNlcyBiZXR3ZWVuIHRoZSBvbGQgYW5kIG5ldyBwcm9wcyBmb3IgZWZmaWNpZW50IHVwZGF0ZXMuXG4gICAgc3RhdGljIGdldFByb3BDaGFuZ2VzKG9sZFByb3BzLCBuZXdQcm9wcykge1xuICAgICAgICBjb25zdCBjaGFuZ2VzID0gW107XG4gICAgICAgIGZvciAoY29uc3QgbmFtZSBpbiBuZXdQcm9wcykge1xuICAgICAgICAgICAgaWYgKG5ld1Byb3BzW25hbWVdICE9PSBvbGRQcm9wc1tuYW1lXSkge1xuICAgICAgICAgICAgICAgIGNoYW5nZXMucHVzaCh7IG5hbWUsIHZhbHVlOiBuZXdQcm9wc1tuYW1lXSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2hhbmdlcztcbiAgICB9XG4gICAgLy8gQWRkIHRoZSBtaXNzaW5nIHVwZGF0ZVN0eWxlIGZ1bmN0aW9uLlxuICAgIHN0YXRpYyB1cGRhdGVTdHlsZShkb20sIG9sZFN0eWxlID0ge30sIG5ld1N0eWxlID0ge30pIHtcbiAgICAgICAgLy8gSWYgc3R5bGVzIGFyZSBwcm92aWRlZCBhcyBhIHN0cmluZywgdXBkYXRlIHRoZSBzdHlsZSBhdHRyaWJ1dGUuXG4gICAgICAgIGlmICh0eXBlb2Ygb2xkU3R5bGUgPT09IFwic3RyaW5nXCIgfHwgdHlwZW9mIG5ld1N0eWxlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBkb20uc2V0QXR0cmlidXRlKFwic3R5bGVcIiwgbmV3U3R5bGUgfHwgXCJcIik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBSZW1vdmUgb2xkIHN0eWxlcyBub3QgcHJlc2VudCBpbiB0aGUgbmV3IHN0eWxlcy5cbiAgICAgICAgICAgIE9iamVjdC5rZXlzKG9sZFN0eWxlKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIShrZXkgaW4gbmV3U3R5bGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvbS5zdHlsZVtrZXldID0gXCJcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIEFwcGx5IG5ldyBzdHlsZXMuXG4gICAgICAgICAgICBPYmplY3Qua2V5cyhuZXdTdHlsZSkuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKG9sZFN0eWxlW2tleV0gIT09IG5ld1N0eWxlW2tleV0pIHtcbiAgICAgICAgICAgICAgICAgICAgZG9tLnN0eWxlW2tleV0gPSBuZXdTdHlsZVtrZXldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIEhlbHBlciBtZXRob2QgdG8gaGFuZGxlIHRoZSBjb21wb25lbnQgbW91bnQgbGlmZWN5Y2xlLlxuICAgIHN0YXRpYyBvbk1vdW50KHZub2RlKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygdm5vZGUgPT09IFwic3RyaW5nXCIpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGlmICh2bm9kZS5jb21wb25lbnQpIHtcbiAgICAgICAgICAgIHZub2RlLmNvbXBvbmVudC5jb21wb25lbnRPbk1vdW50KCk7IC8vIFRyaWdnZXIgY29tcG9uZW50IG1vdW50IGxpZmVjeWNsZS5cbiAgICAgICAgfVxuICAgICAgICB2bm9kZS5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZCkgPT4gQ1RGcmFtZXdvcmsub25Nb3VudChjaGlsZCkpO1xuICAgIH1cbiAgICAvLyBIZWxwZXIgbWV0aG9kIHRvIGhhbmRsZSB0aGUgY29tcG9uZW50IHVubW91bnQgbGlmZWN5Y2xlLlxuICAgIHN0YXRpYyBvblVubW91bnQodm5vZGUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB2bm9kZSA9PT0gXCJzdHJpbmdcIilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaWYgKHZub2RlLmNvbXBvbmVudCkge1xuICAgICAgICAgICAgdm5vZGUuY29tcG9uZW50LmNvbXBvbmVudE9uVW5tb3VudCgpOyAvLyBUcmlnZ2VyIGNvbXBvbmVudCB1bm1vdW50IGxpZmVjeWNsZS5cbiAgICAgICAgfVxuICAgICAgICB2bm9kZS5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZCkgPT4gQ1RGcmFtZXdvcmsub25Vbm1vdW50KGNoaWxkKSk7XG4gICAgfVxufVxuQ1RGcmFtZXdvcmsuZXZlbnRIYW5kbGVycyA9IHt9OyAvLyBTdG9yZSBldmVudCBoYW5kbGVycyBieSB0aGVpciB1bmlxdWUgZXZlbnQgSUQuXG5DVEZyYW1ld29yay5wZW5kaW5nVXBkYXRlcyA9IFtdOyAvLyBRdWV1ZSBmb3IgcGVuZGluZyB1cGRhdGVzIHRvIGJlIHByb2Nlc3NlZC5cbmZ1bmN0aW9uIGd1aWQoKSB7XG4gICAgcmV0dXJuIFwieHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4XCIucmVwbGFjZSgvW3h5XS9nLCAoYykgPT4ge1xuICAgICAgICBjb25zdCByID0gKE1hdGgucmFuZG9tKCkgKiAxNikgfCAwO1xuICAgICAgICBjb25zdCB2ID0gYyA9PT0gXCJ4XCIgPyByIDogKHIgJiAweDMpIHwgMHg4O1xuICAgICAgICByZXR1cm4gdi50b1N0cmluZygxNik7XG4gICAgfSk7XG59XG4vLyBFdmVudCBkZWxlZ2F0aW9uOiBBIHNpbmdsZSBldmVudCBsaXN0ZW5lciBoYW5kbGVzIGFsbCBjbGljayBldmVudHMuXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG4gICAgbGV0IHRhcmdldCA9IGV2ZW50LnRhcmdldDtcbiAgICB3aGlsZSAodGFyZ2V0ICYmICF0YXJnZXQuaGFzQXR0cmlidXRlKFwiY2xpY2stZXZlbnRcIikpIHtcbiAgICAgICAgdGFyZ2V0ID0gdGFyZ2V0LnBhcmVudEVsZW1lbnQ7XG4gICAgfVxuICAgIGlmICh0YXJnZXQpIHtcbiAgICAgICAgY29uc3QgaGFuZGxlciA9IENURnJhbWV3b3JrLmV2ZW50SGFuZGxlcnNbdGFyZ2V0LmdldEF0dHJpYnV0ZShcImNsaWNrLWV2ZW50XCIpXTtcbiAgICAgICAgaGFuZGxlciAmJiBoYW5kbGVyKGV2ZW50KTtcbiAgICB9XG59KTtcbiIsImltcG9ydCB7IENURnJhbWV3b3JrIH0gZnJvbSBcIi4vQ1RGcmFtZXdvcmtcIjtcbi8vIENvbXBvbmVudCBjbGFzcyByZXByZXNlbnRpbmcgYSBVSSBjb21wb25lbnQgd2l0aCBzdGF0ZSBhbmQgbGlmZWN5Y2xlIG1hbmFnZW1lbnQuXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50IHtcbiAgICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgICAgICB0aGlzLnZub2RlID0gbnVsbDtcbiAgICAgICAgdGhpcy5wcm9wcyA9IHByb3BzO1xuICAgICAgICB0aGlzLnN0YXRlID0ge307XG4gICAgfVxuICAgIC8vIFNldCBhIG5ldyBzdGF0ZSBhbmQgc2NoZWR1bGUgYSByZS1yZW5kZXIgaWYgbmVjZXNzYXJ5LlxuICAgIHNldFN0YXRlKG5ld1N0YXRlKSB7XG4gICAgICAgIGNvbnN0IHByZXZTdGF0ZSA9IHRoaXMuc3RhdGU7XG4gICAgICAgIHRoaXMuc3RhdGUgPSBPYmplY3QuYXNzaWduKE9iamVjdC5hc3NpZ24oe30sIHRoaXMuc3RhdGUpLCBuZXdTdGF0ZSk7XG4gICAgICAgIC8vIFNjaGVkdWxlIGEgcmUtcmVuZGVyIGFzeW5jaHJvbm91c2x5LlxuICAgICAgICBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLnZub2RlICYmIHRoaXMuc2hvdWxkQ29tcG9uZW50VXBkYXRlKHRoaXMucHJvcHMsIHByZXZTdGF0ZSkpIHtcbiAgICAgICAgICAgICAgICAvLyBVc2UgQ1RGcmFtZXdvcmsncyByZXJlbmRlciBtZXRob2QgdG8gdXBkYXRlIHRoZSBET01cbiAgICAgICAgICAgICAgICBDVEZyYW1ld29yay5yZXJlbmRlcih0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8vIE1ldGhvZCB0byBjb250cm9sIHdoZXRoZXIgYSBjb21wb25lbnQgc2hvdWxkIHJlLXJlbmRlci5cbiAgICAvLyBPdmVycmlkZSB0aGlzIG1ldGhvZCBpbiBpbmRpdmlkdWFsIGNvbXBvbmVudHMgaWYgc3BlY2lmaWMgY2hlY2tzIGFyZSBuZWVkZWQuXG4gICAgc2hvdWxkQ29tcG9uZW50VXBkYXRlKG5leHRQcm9wcywgbmV4dFN0YXRlKSB7XG4gICAgICAgIHJldHVybiB0cnVlOyAvLyBEZWZhdWx0IGJlaGF2aW9yIGlzIHRvIGFsd2F5cyByZS1yZW5kZXIuXG4gICAgfVxuICAgIC8vIFJlbmRlciBtZXRob2QgbXVzdCBiZSBpbXBsZW1lbnRlZCBieSBhbnkgY2xhc3MgZXh0ZW5kaW5nIENvbXBvbmVudC5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgUmVuZGVyIG1ldGhvZCBtdXN0IGJlIGltcGxlbWVudGVkIGluIHRoZSBjb21wb25lbnQgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9YCk7XG4gICAgfVxuICAgIC8vIExpZmVjeWNsZSBtZXRob2RzLCB3aGljaCBjYW4gYmUgb3ZlcnJpZGRlbiBieSBjb21wb25lbnRzLlxuICAgIGNvbXBvbmVudE9uTW91bnQoKSB7IH1cbiAgICBjb21wb25lbnRPblVwZGF0ZShwcmV2UHJvcHMsIHByZXZTdGF0ZSkgeyB9XG4gICAgY29tcG9uZW50T25Vbm1vdW50KCkgeyB9XG4gICAgY29tcG9uZW50T25DYXRjaChlcnJvciwgaW5mbykgeyB9XG59XG4vLyBNZW1vaXphdGlvbiBoZWxwZXIgZnVuY3Rpb24gZm9yIGNvbXBvbmVudHMuXG4vLyBJdCBwcmV2ZW50cyB1bm5lY2Vzc2FyeSByZS1yZW5kZXJzIGJ5IGNoZWNraW5nIGlmIHRoZSBwcm9wcyBoYXZlIGNoYW5nZWQuXG5leHBvcnQgZnVuY3Rpb24gbWVtbyhDb21wb25lbnRDbGFzcykge1xuICAgIHJldHVybiBjbGFzcyBNZW1vaXplZENvbXBvbmVudCBleHRlbmRzIENvbXBvbmVudCB7XG4gICAgICAgIHNob3VsZENvbXBvbmVudFVwZGF0ZShuZXh0UHJvcHMpIHtcbiAgICAgICAgICAgIHJldHVybiBzaGFsbG93Q29tcGFyZSh0aGlzLnByb3BzLCBuZXh0UHJvcHMpOyAvLyBVc2Ugc2hhbGxvdyBjb21wYXJpc29uIG9mIHByb3BzIHRvIHByZXZlbnQgcmUtcmVuZGVyaW5nLlxuICAgICAgICB9XG4gICAgICAgIC8vIEZvcndhcmQgdGhlIHJlbmRlciBtZXRob2QgZnJvbSB0aGUgb3JpZ2luYWwgY29tcG9uZW50IGNsYXNzXG4gICAgICAgIHJlbmRlcigpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgQ29tcG9uZW50Q2xhc3ModGhpcy5wcm9wcykucmVuZGVyKCk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuLy8gQSBzaGFsbG93IGNvbXBhcmlzb24gZnVuY3Rpb24gdG8gY2hlY2sgaWYgdHdvIG9iamVjdHMgYXJlIGRpZmZlcmVudC5cbmZ1bmN0aW9uIHNoYWxsb3dDb21wYXJlKG9iajEsIG9iajIpIHtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBvYmoxKSB7XG4gICAgICAgIGlmIChvYmoxW2tleV0gIT09IG9iajJba2V5XSlcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2pzeC5kLnRzXCIgLz5cbmltcG9ydCB7IENvbXBvbmVudCwgbWVtbyB9IGZyb20gXCIuL0NvbXBvbmVudFwiO1xuaW1wb3J0IHsgY3JlYXRlRWxlbWVudCwgQ1RGcmFtZXdvcmsgfSBmcm9tIFwiLi9DVEZyYW1ld29ya1wiO1xuZXhwb3J0IHsgQ29tcG9uZW50LCBtZW1vLCBjcmVhdGVFbGVtZW50IH07XG5leHBvcnQgZGVmYXVsdCBDVEZyYW1ld29yaztcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==