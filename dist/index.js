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
/* harmony export */   Fragment: () => (/* binding */ Fragment),
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
function Fragment(props) {
    return props.children || [];
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
        if (vnode.children && vnode.children.length > 0) {
            vnode.children.forEach((child) => {
                const childDom = CTFramework.createDom(child);
                element.appendChild(childDom);
            });
        }
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

__webpack_exports__ = __webpack_exports__["default"];
/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=index.js.map