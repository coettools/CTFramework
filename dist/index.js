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

__webpack_exports__ = __webpack_exports__.CTFramework;
/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDalMyQztBQUM1QztBQUNPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1EQUFtRDtBQUNuRDtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQixxREFBVztBQUMzQjtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQSw4RUFBOEUsc0JBQXNCO0FBQ3BHO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNBLDBEQUEwRDtBQUMxRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7VUN2REE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7Ozs7V0N0QkE7V0FDQTtXQUNBO1dBQ0E7V0FDQSx5Q0FBeUMsd0NBQXdDO1dBQ2pGO1dBQ0E7V0FDQTs7Ozs7V0NQQTs7Ozs7V0NBQTtXQUNBO1dBQ0E7V0FDQSx1REFBdUQsaUJBQWlCO1dBQ3hFO1dBQ0EsZ0RBQWdELGFBQWE7V0FDN0Q7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDTkE7QUFDOEM7QUFDYTtBQUNqQjtBQUMxQyxpRUFBZSxxREFBVyxFQUFDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vQ1RGcmFtZXdvcmsvd2VicGFjay91bml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uIiwid2VicGFjazovL0NURnJhbWV3b3JrLy4vc3JjL0NURnJhbWV3b3JrLnRzIiwid2VicGFjazovL0NURnJhbWV3b3JrLy4vc3JjL0NvbXBvbmVudC50cyIsIndlYnBhY2s6Ly9DVEZyYW1ld29yay93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9DVEZyYW1ld29yay93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vQ1RGcmFtZXdvcmsvd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9DVEZyYW1ld29yay93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL0NURnJhbWV3b3JrLy4vc3JjL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiB3ZWJwYWNrVW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvbihyb290LCBmYWN0b3J5KSB7XG5cdGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0Jylcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcblx0ZWxzZSBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpXG5cdFx0ZGVmaW5lKFtdLCBmYWN0b3J5KTtcblx0ZWxzZSBpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpXG5cdFx0ZXhwb3J0c1tcIkNURnJhbWV3b3JrXCJdID0gZmFjdG9yeSgpO1xuXHRlbHNlXG5cdFx0cm9vdFtcIkNURnJhbWV3b3JrXCJdID0gZmFjdG9yeSgpO1xufSkodGhpcywgKCkgPT4ge1xucmV0dXJuICIsImV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFbGVtZW50KHRhZywgcHJvcHMsIC4uLmNoaWxkcmVuKSB7XG4gICAgcHJvcHMgPSBwcm9wcyB8fCB7fTtcbiAgICByZXR1cm4ge1xuICAgICAgICB0YWcsXG4gICAgICAgIHByb3BzOiBPYmplY3QuYXNzaWduKHt9LCBwcm9wcyksXG4gICAgICAgIGNoaWxkcmVuOiBjaGlsZHJlbi5mbGF0KCksXG4gICAgICAgIGtleTogKHByb3BzID09PSBudWxsIHx8IHByb3BzID09PSB2b2lkIDAgPyB2b2lkIDAgOiBwcm9wcy5rZXkpIHx8IG51bGwsXG4gICAgfTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBGcmFnbWVudChwcm9wcykge1xuICAgIHJldHVybiBwcm9wcy5jaGlsZHJlbiB8fCBbXTtcbn1cbmV4cG9ydCBjbGFzcyBDVEZyYW1ld29yayB7XG4gICAgLy8gUmVuZGVyIGEgY29tcG9uZW50IGludG8gYSBET00gY29udGFpbmVyLlxuICAgIHN0YXRpYyByZW5kZXIoY29tcG9uZW50LCBjb250YWluZXIpIHtcbiAgICAgICAgY29uc3Qgdm5vZGUgPSBjb21wb25lbnQucmVuZGVyKCk7IC8vIEdlbmVyYXRlIHRoZSBpbml0aWFsIHZpcnR1YWwgbm9kZSBmcm9tIHRoZSBjb21wb25lbnQncyByZW5kZXIgbWV0aG9kLlxuICAgICAgICB2bm9kZS5jb21wb25lbnQgPSBjb21wb25lbnQ7XG4gICAgICAgIGNvbXBvbmVudC52bm9kZSA9IHZub2RlO1xuICAgICAgICBjb25zdCBkb20gPSBDVEZyYW1ld29yay5jcmVhdGVEb20odm5vZGUpOyAvLyBDcmVhdGUgdGhlIGFjdHVhbCBET00gZWxlbWVudCBmcm9tIHRoZSB2aXJ0dWFsIG5vZGUuXG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChkb20pOyAvLyBBdHRhY2ggaXQgdG8gdGhlIGNvbnRhaW5lci5cbiAgICAgICAgQ1RGcmFtZXdvcmsub25Nb3VudCh2bm9kZSk7IC8vIFRyaWdnZXIgdGhlIGNvbXBvbmVudCdzIG1vdW50IGxpZmVjeWNsZS5cbiAgICB9XG4gICAgLy8gU2NoZWR1bGUgdXBkYXRlcyB0byBiZSBwcm9jZXNzZWQgaW4gdGhlIG5leHQgYW5pbWF0aW9uIGZyYW1lIGZvciBiZXR0ZXIgcGVyZm9ybWFuY2UuXG4gICAgc3RhdGljIHNjaGVkdWxlVXBkYXRlKHVwZGF0ZUZuKSB7XG4gICAgICAgIENURnJhbWV3b3JrLnBlbmRpbmdVcGRhdGVzLnB1c2godXBkYXRlRm4pO1xuICAgICAgICBpZiAoQ1RGcmFtZXdvcmsucGVuZGluZ1VwZGF0ZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoQ1RGcmFtZXdvcmsucHJvY2Vzc1VwZGF0ZXMpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIFByb2Nlc3MgYWxsIHBlbmRpbmcgdXBkYXRlcyBmcm9tIHRoZSBxdWV1ZS5cbiAgICBzdGF0aWMgcHJvY2Vzc1VwZGF0ZXMoKSB7XG4gICAgICAgIHdoaWxlIChDVEZyYW1ld29yay5wZW5kaW5nVXBkYXRlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IHVwZGF0ZUZuID0gQ1RGcmFtZXdvcmsucGVuZGluZ1VwZGF0ZXMuc2hpZnQoKTtcbiAgICAgICAgICAgIHVwZGF0ZUZuICYmIHVwZGF0ZUZuKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gUmUtcmVuZGVyIGEgY29tcG9uZW50IGFuZCB1cGRhdGUgdGhlIERPTSBvbmx5IGlmIG5lY2Vzc2FyeS5cbiAgICBzdGF0aWMgcmVyZW5kZXIoY29tcG9uZW50KSB7XG4gICAgICAgIHZhciBfYSwgX2I7XG4gICAgICAgIGlmICghY29tcG9uZW50LnZub2RlKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBvbGRWTm9kZSA9IGNvbXBvbmVudC52bm9kZTtcbiAgICAgICAgaWYgKCFjb21wb25lbnQuc2hvdWxkQ29tcG9uZW50VXBkYXRlKGNvbXBvbmVudC5wcm9wcywgY29tcG9uZW50LnN0YXRlKSkge1xuICAgICAgICAgICAgcmV0dXJuOyAvLyBTa2lwIHJlLXJlbmRlciBpZiBzaG91bGRDb21wb25lbnRVcGRhdGUgcmV0dXJucyBmYWxzZS5cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBuZXdWTm9kZSA9IGNvbXBvbmVudC5yZW5kZXIoKTsgLy8gUmVuZGVyIHRoZSB1cGRhdGVkIHZpcnR1YWwgbm9kZS5cbiAgICAgICAgbmV3Vk5vZGUuY29tcG9uZW50ID0gY29tcG9uZW50O1xuICAgICAgICBjb25zdCB1cGRhdGVkRG9tID0gQ1RGcmFtZXdvcmsudXBkYXRlRG9tKG9sZFZOb2RlLCBuZXdWTm9kZSk7IC8vIFVwZGF0ZSB0aGUgRE9NLlxuICAgICAgICAvLyBSZXBsYWNlIHRoZSBET00gbm9kZSBpZiBuZWNlc3NhcnkuXG4gICAgICAgIGlmICh0eXBlb2Ygb2xkVk5vZGUgIT09IFwic3RyaW5nXCIgJiYgdXBkYXRlZERvbSAhPT0gb2xkVk5vZGUuZG9tICYmIG9sZFZOb2RlLmRvbSkge1xuICAgICAgICAgICAgKF9iID0gKF9hID0gb2xkVk5vZGUuZG9tKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EucGFyZW50Tm9kZSkgPT09IG51bGwgfHwgX2IgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9iLnJlcGxhY2VDaGlsZCh1cGRhdGVkRG9tLCBvbGRWTm9kZS5kb20pO1xuICAgICAgICB9XG4gICAgICAgIGNvbXBvbmVudC52bm9kZSA9IG5ld1ZOb2RlOyAvLyBTdG9yZSB0aGUgbmV3IHZpcnR1YWwgbm9kZSBpbiB0aGUgY29tcG9uZW50LlxuICAgICAgICBjb21wb25lbnQuY29tcG9uZW50T25VcGRhdGUoY29tcG9uZW50LnByb3BzLCBjb21wb25lbnQuc3RhdGUpOyAvLyBUcmlnZ2VyIHRoZSB1cGRhdGUgbGlmZWN5Y2xlLlxuICAgIH1cbiAgICAvLyBDcmVhdGUgYSBET00gbm9kZSBmcm9tIGEgdmlydHVhbCBub2RlLlxuICAgIHN0YXRpYyBjcmVhdGVEb20odm5vZGUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB2bm9kZSA9PT0gXCJzdHJpbmdcIiB8fCB0eXBlb2Ygdm5vZGUgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShTdHJpbmcodm5vZGUpKTsgLy8gQ29udmVydCBudW1iZXJzIHRvIHRleHQgbm9kZXMgYXMgd2VsbC5cbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHZub2RlLnRhZyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAvLyBIYW5kbGUgZnVuY3Rpb25hbCBvciBjbGFzcy1iYXNlZCBjb21wb25lbnRzLlxuICAgICAgICAgICAgY29uc3QgQ29tcG9uZW50Q2xhc3MgPSB2bm9kZS50YWc7XG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnQgPSBuZXcgQ29tcG9uZW50Q2xhc3Modm5vZGUucHJvcHMpO1xuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50Vk5vZGUgPSBjb21wb25lbnQucmVuZGVyKCk7XG4gICAgICAgICAgICBjb21wb25lbnRWTm9kZS5jb21wb25lbnQgPSBjb21wb25lbnQ7XG4gICAgICAgICAgICB2bm9kZS5jb21wb25lbnQgPSBjb21wb25lbnQ7XG4gICAgICAgICAgICBjb21wb25lbnQudm5vZGUgPSBjb21wb25lbnRWTm9kZTtcbiAgICAgICAgICAgIGNvbnN0IGRvbSA9IENURnJhbWV3b3JrLmNyZWF0ZURvbShjb21wb25lbnRWTm9kZSk7XG4gICAgICAgICAgICB2bm9kZS5kb20gPSBkb207XG4gICAgICAgICAgICBjb21wb25lbnQuY29tcG9uZW50T25Nb3VudCgpO1xuICAgICAgICAgICAgcmV0dXJuIGRvbTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh2bm9kZS50YWcpOyAvLyBDcmVhdGUgYSBET00gZWxlbWVudCBmb3IgdGhlIHRhZy5cbiAgICAgICAgdm5vZGUuZG9tID0gZWxlbWVudDtcbiAgICAgICAgLy8gRXZlbnQgZGVsZWdhdGlvbjogQXR0YWNoIGEgY2xpY2stZXZlbnQgYXR0cmlidXRlIGFuZCBzdG9yZSB0aGUgZXZlbnQgaGFuZGxlci5cbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIHZub2RlIGhhcyBhbiBvbkNsaWNrIHByb3AgYmVmb3JlIGFkZGluZyB0aGUgZXZlbnQgaGFuZGxlclxuICAgICAgICBpZiAodm5vZGUucHJvcHMgJiYgdm5vZGUucHJvcHMub25DbGljaykge1xuICAgICAgICAgICAgY29uc3Qgb2xkRXZlbnRJZCA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKFwiY2xpY2stZXZlbnRcIik7XG4gICAgICAgICAgICBpZiAob2xkRXZlbnRJZCAmJiBDVEZyYW1ld29yay5ldmVudEhhbmRsZXJzW29sZEV2ZW50SWRdKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIENURnJhbWV3b3JrLmV2ZW50SGFuZGxlcnNbb2xkRXZlbnRJZF07IC8vIFJlbW92ZSB0aGUgb2xkIGhhbmRsZXJcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIE9ubHkgYWRkIHRoZSBldmVudCBsaXN0ZW5lciBhbmQgSUQgaWYgdGhlIGNvbXBvbmVudCBoYXMgYSBjbGljayBldmVudFxuICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJjbGljay1ldmVudFwiLCBndWlkKCkpO1xuICAgICAgICAgICAgQ1RGcmFtZXdvcmsuZXZlbnRIYW5kbGVyc1tlbGVtZW50LmdldEF0dHJpYnV0ZShcImNsaWNrLWV2ZW50XCIpXSA9IHZub2RlLnByb3BzLm9uQ2xpY2s7XG4gICAgICAgIH1cbiAgICAgICAgLy8gU2V0IHByb3BlcnRpZXMgYW5kIHN0eWxlcy5cbiAgICAgICAgQ1RGcmFtZXdvcmsudXBkYXRlRG9tUHJvcGVydGllcyhlbGVtZW50LCB7fSwgdm5vZGUucHJvcHMpO1xuICAgICAgICAvLyBSZWN1cnNpdmVseSBjcmVhdGUgRE9NIGZvciBjaGlsZCBub2Rlcy5cbiAgICAgICAgaWYgKHZub2RlLmNoaWxkcmVuICYmIHZub2RlLmNoaWxkcmVuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHZub2RlLmNoaWxkcmVuLmZvckVhY2goKGNoaWxkKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2hpbGREb20gPSBDVEZyYW1ld29yay5jcmVhdGVEb20oY2hpbGQpO1xuICAgICAgICAgICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoY2hpbGREb20pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgfVxuICAgIC8vIFVwZGF0ZSB0aGUgRE9NIGJ5IGNvbXBhcmluZyB0aGUgb2xkIGFuZCBuZXcgdmlydHVhbCBub2Rlcy5cbiAgICBzdGF0aWMgdXBkYXRlRG9tKG9sZFZOb2RlLCBuZXdWTm9kZSkge1xuICAgICAgICAvLyBIYW5kbGUgdGV4dCBub2Rlc1xuICAgICAgICBpZiAodHlwZW9mIG9sZFZOb2RlID09PSBcInN0cmluZ1wiIHx8IHR5cGVvZiBuZXdWTm9kZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgY29uc3QgbmV3VGV4dENvbnRlbnQgPSAodHlwZW9mIG5ld1ZOb2RlID09PSBcInN0cmluZ1wiID8gbmV3Vk5vZGUgOiBcIlwiKSB8fCBcIlwiO1xuICAgICAgICAgICAgaWYgKG9sZFZOb2RlICE9PSBuZXdUZXh0Q29udGVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShuZXdUZXh0Q29udGVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mIG9sZFZOb2RlID09PSBcInN0cmluZ1wiID8gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUob2xkVk5vZGUpIDogb2xkVk5vZGUuZG9tO1xuICAgICAgICB9XG4gICAgICAgIC8vIFN0YXRpYyBub2RlIGNoZWNrIHJlbWFpbnNcbiAgICAgICAgaWYgKG9sZFZOb2RlLmlzU3RhdGljKSB7XG4gICAgICAgICAgICBuZXdWTm9kZS5kb20gPSBvbGRWTm9kZS5kb207XG4gICAgICAgICAgICBuZXdWTm9kZS5jb21wb25lbnQgPSBvbGRWTm9kZS5jb21wb25lbnQ7XG4gICAgICAgICAgICByZXR1cm4gbmV3Vk5vZGUuZG9tO1xuICAgICAgICB9XG4gICAgICAgIC8vIFJlcGxhY2Ugbm9kZSBpZiB0YWcgaXMgZGlmZmVyZW50XG4gICAgICAgIGlmIChvbGRWTm9kZS50YWcgIT09IG5ld1ZOb2RlLnRhZykge1xuICAgICAgICAgICAgY29uc3QgbmV3RG9tID0gQ1RGcmFtZXdvcmsuY3JlYXRlRG9tKG5ld1ZOb2RlKTtcbiAgICAgICAgICAgIGlmIChvbGRWTm9kZS5kb20gJiYgb2xkVk5vZGUuZG9tLnBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgICAgICBvbGRWTm9kZS5kb20ucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQobmV3RG9tLCBvbGRWTm9kZS5kb20pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG5ld0RvbTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBkb20gPSBvbGRWTm9kZS5kb207XG4gICAgICAgIG5ld1ZOb2RlLmRvbSA9IGRvbTtcbiAgICAgICAgLy8gKipFbnN1cmUgdGV4dCBjb250ZW50IGlzIHVwZGF0ZWQqKjpcbiAgICAgICAgLy8gSWYgd2UncmUgZGVhbGluZyB3aXRoIHRleHQgaW5zaWRlIGFuIGVsZW1lbnQgKGxpa2UgPGgxPilcbiAgICAgICAgaWYgKG5ld1ZOb2RlLmNoaWxkcmVuLmxlbmd0aCA9PT0gMSAmJiB0eXBlb2YgbmV3Vk5vZGUuY2hpbGRyZW5bMF0gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIGlmIChkb20udGV4dENvbnRlbnQgIT09IG5ld1ZOb2RlLmNoaWxkcmVuWzBdKSB7XG4gICAgICAgICAgICAgICAgZG9tLnRleHRDb250ZW50ID0gbmV3Vk5vZGUuY2hpbGRyZW5bMF07IC8vIFVwZGF0ZSB0ZXh0IGRpcmVjdGx5XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gVXBkYXRlIHByb3BlcnRpZXMgZXZlbiBpZiBjaGlsZHJlbiBoYXZlbid0IGNoYW5nZWRcbiAgICAgICAgQ1RGcmFtZXdvcmsudXBkYXRlRG9tUHJvcGVydGllcyhkb20sIG9sZFZOb2RlLnByb3BzLCBuZXdWTm9kZS5wcm9wcyk7XG4gICAgICAgIC8vIEhhbmRsZSBjaGlsZHJlbiB1cGRhdGVzIChvbmx5IGlmIHRoZXkgZXhpc3QpXG4gICAgICAgIGNvbnN0IG9sZENoaWxkcmVuID0gb2xkVk5vZGUuY2hpbGRyZW4gfHwgW107XG4gICAgICAgIGNvbnN0IG5ld0NoaWxkcmVuID0gbmV3Vk5vZGUuY2hpbGRyZW4gfHwgW107XG4gICAgICAgIGlmIChvbGRDaGlsZHJlbi5sZW5ndGggPT09IDAgJiYgbmV3Q2hpbGRyZW4ubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gQ1RGcmFtZXdvcmsuY3JlYXRlRG9tKG5ld1ZOb2RlKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBvbGRDaGlsZHJlbk1hcCA9IG5ldyBNYXAoKTtcbiAgICAgICAgLy8gTWFwIG9sZCBjaGlsZHJlbiBieSBrZXlzIGlmIGFueVxuICAgICAgICBvbGRDaGlsZHJlbi5mb3JFYWNoKChjaGlsZCkgPT4ge1xuICAgICAgICAgICAgaWYgKGNoaWxkICYmIHR5cGVvZiBjaGlsZCAhPT0gXCJzdHJpbmdcIiAmJiBjaGlsZC5rZXkpIHtcbiAgICAgICAgICAgICAgICBvbGRDaGlsZHJlbk1hcC5zZXQoY2hpbGQua2V5LCBjaGlsZCk7IC8vICoqVHJhY2sgY2hpbGRyZW4gYnkga2V5KipcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIC8vICoqSXRlcmF0ZSB0aHJvdWdoIG5ldyBjaGlsZHJlbioqXG4gICAgICAgIG5ld0NoaWxkcmVuLmZvckVhY2goKG5ld0NoaWxkLCBpKSA9PiB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG5ld0NoaWxkID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbmV3VGV4dENvbnRlbnQgPSBuZXdDaGlsZCB8fCBcIlwiO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9sZENoaWxkID0gb2xkQ2hpbGRyZW5baV07XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBvbGRDaGlsZCA9PT0gXCJzdHJpbmdcIiAmJiBvbGRDaGlsZCAhPT0gbmV3VGV4dENvbnRlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gKipVcGRhdGUgdGV4dCBjb250ZW50IGlmIG5lZWRlZCoqXG4gICAgICAgICAgICAgICAgICAgIGRvbS5jaGlsZE5vZGVzW2ldLnRleHRDb250ZW50ID0gbmV3VGV4dENvbnRlbnQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGRvbS5jaGlsZE5vZGVzW2ldKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvbS5yZXBsYWNlQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUobmV3VGV4dENvbnRlbnQpLCBkb20uY2hpbGROb2Rlc1tpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBkb20uYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUobmV3VGV4dENvbnRlbnQpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCBrZXkgPSBuZXdDaGlsZC5rZXk7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2xkQ2hpbGQgPSBrZXkgPyBvbGRDaGlsZHJlbk1hcC5nZXQoa2V5KSA6IG9sZENoaWxkcmVuW2ldOyAvLyAqKkxvb2sgZm9yIG1hdGNoaW5nIG9sZCBjaGlsZCBieSBrZXkgb3IgaW5kZXgqKlxuICAgICAgICAgICAgICAgIGlmIChvbGRDaGlsZCkge1xuICAgICAgICAgICAgICAgICAgICAvLyAqKlVwZGF0ZSB0aGUgRE9NIGZvciB0aGUgbWF0Y2hpbmcgY2hpbGQqKlxuICAgICAgICAgICAgICAgICAgICBjb25zdCB1cGRhdGVkQ2hpbGREb20gPSBDVEZyYW1ld29yay51cGRhdGVEb20ob2xkQ2hpbGQsIG5ld0NoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRvbS5jaGlsZE5vZGVzW2ldICE9PSB1cGRhdGVkQ2hpbGREb20pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvbS5yZXBsYWNlQ2hpbGQodXBkYXRlZENoaWxkRG9tLCBkb20uY2hpbGROb2Rlc1tpXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGtleSlcbiAgICAgICAgICAgICAgICAgICAgICAgIG9sZENoaWxkcmVuTWFwLmRlbGV0ZShrZXkpOyAvLyAqKlJlbW92ZSBrZXkgZnJvbSBtYXAgb25jZSB1cGRhdGVkKipcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vICoqSWYgbm8gbWF0Y2hpbmcgb2xkIGNoaWxkLCBjcmVhdGUgYSBuZXcgRE9NIG5vZGUqKlxuICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXdDaGlsZERvbSA9IENURnJhbWV3b3JrLmNyZWF0ZURvbShuZXdDaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgIGRvbS5hcHBlbmRDaGlsZChuZXdDaGlsZERvbSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgLy8gKipSZW1vdmUgb2xkIGNoaWxkcmVuIHRoYXQgYXJlIG5vIGxvbmdlciBwcmVzZW50KipcbiAgICAgICAgb2xkQ2hpbGRyZW5NYXAuZm9yRWFjaCgob2xkQ2hpbGQpID0+IHtcbiAgICAgICAgICAgIGlmIChvbGRDaGlsZC5kb20gJiYgZG9tLmNvbnRhaW5zKG9sZENoaWxkLmRvbSkpIHtcbiAgICAgICAgICAgICAgICBkb20ucmVtb3ZlQ2hpbGQob2xkQ2hpbGQuZG9tKTsgLy8gKipSZW1vdmUgb2xkIERPTSBlbGVtZW50cyB0aGF0IGFyZSBubyBsb25nZXIgaW4gbmV3Vk5vZGUqKlxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGRvbTtcbiAgICB9XG4gICAgLy8gVXBkYXRlIHRoZSBwcm9wZXJ0aWVzIGFuZCBzdHlsZXMgb2YgYSBET00gZWxlbWVudC5cbiAgICBzdGF0aWMgdXBkYXRlRG9tUHJvcGVydGllcyhkb20sIG9sZFByb3BzID0ge30sIG5ld1Byb3BzID0ge30pIHtcbiAgICAgICAgdmFyIF9hO1xuICAgICAgICBjb25zdCBjaGFuZ2VzID0gQ1RGcmFtZXdvcmsuZ2V0UHJvcENoYW5nZXMob2xkUHJvcHMsIG5ld1Byb3BzKTtcbiAgICAgICAgLy8gQ2hlY2sgaWYgY2xpY2stZXZlbnQgZXhpc3RzIG9uIHRoZSBET00gZWxlbWVudCwgb3RoZXJ3aXNlIGNyZWF0ZSBvbmVcbiAgICAgICAgbGV0IGV2ZW50SWQgPSAoX2EgPSBkb20uZ2V0QXR0cmlidXRlKFwiY2xpY2stZXZlbnRcIikpICE9PSBudWxsICYmIF9hICE9PSB2b2lkIDAgPyBfYSA6IFwiXCI7XG4gICAgICAgIGNoYW5nZXMuZm9yRWFjaCgoeyBuYW1lLCB2YWx1ZSB9KSA9PiB7XG4gICAgICAgICAgICBpZiAobmFtZSA9PT0gXCJzdHlsZVwiKSB7XG4gICAgICAgICAgICAgICAgQ1RGcmFtZXdvcmsudXBkYXRlU3R5bGUoZG9tLCBvbGRQcm9wcy5zdHlsZSwgbmV3UHJvcHMuc3R5bGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAobmFtZS5zdGFydHNXaXRoKFwib25cIikpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBldmVudFR5cGUgPSBuYW1lLnRvTG93ZXJDYXNlKCkuc3Vic3RyaW5nKDIpO1xuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSB0aGUgb2xkIGV2ZW50IGxpc3RlbmVyIGZyb20gQ1RGcmFtZXdvcmsuZXZlbnRIYW5kbGVycyB1c2luZyBjbGljay1ldmVudFxuICAgICAgICAgICAgICAgIGlmIChDVEZyYW1ld29yay5ldmVudEhhbmRsZXJzW2V2ZW50SWRdKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBDVEZyYW1ld29yay5ldmVudEhhbmRsZXJzW2V2ZW50SWRdOyAvLyBSZW1vdmUgZnJvbSBldmVudCBoYW5kbGVycyBtYXBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gQWRkIHRoZSBuZXcgZXZlbnQgbGlzdGVuZXIgaW4gQ1RGcmFtZXdvcmsuZXZlbnRIYW5kbGVycyB1c2luZyBjbGljay1ldmVudFxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICBDVEZyYW1ld29yay5ldmVudEhhbmRsZXJzW2V2ZW50SWRdID0gdmFsdWU7IC8vIFVwZGF0ZSB0aGUgZXZlbnQgaGFuZGxlciBpbiB0aGUgbWFwXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAobmFtZSA9PT0gXCJ0ZXh0Q29udGVudFwiKSB7XG4gICAgICAgICAgICAgICAgZG9tLnRleHRDb250ZW50ID0gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChuYW1lIGluIGRvbSkge1xuICAgICAgICAgICAgICAgIGRvbVtuYW1lXSA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZG9tLnNldEF0dHJpYnV0ZShuYW1lLCB2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAvLyBHZXQgdGhlIGRpZmZlcmVuY2VzIGJldHdlZW4gdGhlIG9sZCBhbmQgbmV3IHByb3BzIGZvciBlZmZpY2llbnQgdXBkYXRlcy5cbiAgICBzdGF0aWMgZ2V0UHJvcENoYW5nZXMob2xkUHJvcHMsIG5ld1Byb3BzKSB7XG4gICAgICAgIGNvbnN0IGNoYW5nZXMgPSBbXTtcbiAgICAgICAgZm9yIChjb25zdCBuYW1lIGluIG5ld1Byb3BzKSB7XG4gICAgICAgICAgICBpZiAobmV3UHJvcHNbbmFtZV0gIT09IG9sZFByb3BzW25hbWVdKSB7XG4gICAgICAgICAgICAgICAgY2hhbmdlcy5wdXNoKHsgbmFtZSwgdmFsdWU6IG5ld1Byb3BzW25hbWVdIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjaGFuZ2VzO1xuICAgIH1cbiAgICAvLyBBZGQgdGhlIG1pc3NpbmcgdXBkYXRlU3R5bGUgZnVuY3Rpb24uXG4gICAgc3RhdGljIHVwZGF0ZVN0eWxlKGRvbSwgb2xkU3R5bGUgPSB7fSwgbmV3U3R5bGUgPSB7fSkge1xuICAgICAgICAvLyBJZiBzdHlsZXMgYXJlIHByb3ZpZGVkIGFzIGEgc3RyaW5nLCB1cGRhdGUgdGhlIHN0eWxlIGF0dHJpYnV0ZS5cbiAgICAgICAgaWYgKHR5cGVvZiBvbGRTdHlsZSA9PT0gXCJzdHJpbmdcIiB8fCB0eXBlb2YgbmV3U3R5bGUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIGRvbS5zZXRBdHRyaWJ1dGUoXCJzdHlsZVwiLCBuZXdTdHlsZSB8fCBcIlwiKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIFJlbW92ZSBvbGQgc3R5bGVzIG5vdCBwcmVzZW50IGluIHRoZSBuZXcgc3R5bGVzLlxuICAgICAgICAgICAgT2JqZWN0LmtleXMob2xkU3R5bGUpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghKGtleSBpbiBuZXdTdHlsZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgZG9tLnN0eWxlW2tleV0gPSBcIlwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gQXBwbHkgbmV3IHN0eWxlcy5cbiAgICAgICAgICAgIE9iamVjdC5rZXlzKG5ld1N0eWxlKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAob2xkU3R5bGVba2V5XSAhPT0gbmV3U3R5bGVba2V5XSkge1xuICAgICAgICAgICAgICAgICAgICBkb20uc3R5bGVba2V5XSA9IG5ld1N0eWxlW2tleV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gSGVscGVyIG1ldGhvZCB0byBoYW5kbGUgdGhlIGNvbXBvbmVudCBtb3VudCBsaWZlY3ljbGUuXG4gICAgc3RhdGljIG9uTW91bnQodm5vZGUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB2bm9kZSA9PT0gXCJzdHJpbmdcIilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaWYgKHZub2RlLmNvbXBvbmVudCkge1xuICAgICAgICAgICAgdm5vZGUuY29tcG9uZW50LmNvbXBvbmVudE9uTW91bnQoKTsgLy8gVHJpZ2dlciBjb21wb25lbnQgbW91bnQgbGlmZWN5Y2xlLlxuICAgICAgICB9XG4gICAgICAgIHZub2RlLmNoaWxkcmVuLmZvckVhY2goKGNoaWxkKSA9PiBDVEZyYW1ld29yay5vbk1vdW50KGNoaWxkKSk7XG4gICAgfVxuICAgIC8vIEhlbHBlciBtZXRob2QgdG8gaGFuZGxlIHRoZSBjb21wb25lbnQgdW5tb3VudCBsaWZlY3ljbGUuXG4gICAgc3RhdGljIG9uVW5tb3VudCh2bm9kZSkge1xuICAgICAgICBpZiAodHlwZW9mIHZub2RlID09PSBcInN0cmluZ1wiKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBpZiAodm5vZGUuY29tcG9uZW50KSB7XG4gICAgICAgICAgICB2bm9kZS5jb21wb25lbnQuY29tcG9uZW50T25Vbm1vdW50KCk7IC8vIFRyaWdnZXIgY29tcG9uZW50IHVubW91bnQgbGlmZWN5Y2xlLlxuICAgICAgICB9XG4gICAgICAgIHZub2RlLmNoaWxkcmVuLmZvckVhY2goKGNoaWxkKSA9PiBDVEZyYW1ld29yay5vblVubW91bnQoY2hpbGQpKTtcbiAgICB9XG59XG5DVEZyYW1ld29yay5ldmVudEhhbmRsZXJzID0ge307IC8vIFN0b3JlIGV2ZW50IGhhbmRsZXJzIGJ5IHRoZWlyIHVuaXF1ZSBldmVudCBJRC5cbkNURnJhbWV3b3JrLnBlbmRpbmdVcGRhdGVzID0gW107IC8vIFF1ZXVlIGZvciBwZW5kaW5nIHVwZGF0ZXMgdG8gYmUgcHJvY2Vzc2VkLlxuZnVuY3Rpb24gZ3VpZCgpIHtcbiAgICByZXR1cm4gXCJ4eHh4eHh4eC14eHh4LTR4eHgteXh4eC14eHh4eHh4eHh4eHhcIi5yZXBsYWNlKC9beHldL2csIChjKSA9PiB7XG4gICAgICAgIGNvbnN0IHIgPSAoTWF0aC5yYW5kb20oKSAqIDE2KSB8IDA7XG4gICAgICAgIGNvbnN0IHYgPSBjID09PSBcInhcIiA/IHIgOiAociAmIDB4MykgfCAweDg7XG4gICAgICAgIHJldHVybiB2LnRvU3RyaW5nKDE2KTtcbiAgICB9KTtcbn1cbi8vIEV2ZW50IGRlbGVnYXRpb246IEEgc2luZ2xlIGV2ZW50IGxpc3RlbmVyIGhhbmRsZXMgYWxsIGNsaWNrIGV2ZW50cy5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZXZlbnQpID0+IHtcbiAgICBsZXQgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0O1xuICAgIHdoaWxlICh0YXJnZXQgJiYgIXRhcmdldC5oYXNBdHRyaWJ1dGUoXCJjbGljay1ldmVudFwiKSkge1xuICAgICAgICB0YXJnZXQgPSB0YXJnZXQucGFyZW50RWxlbWVudDtcbiAgICB9XG4gICAgaWYgKHRhcmdldCkge1xuICAgICAgICBjb25zdCBoYW5kbGVyID0gQ1RGcmFtZXdvcmsuZXZlbnRIYW5kbGVyc1t0YXJnZXQuZ2V0QXR0cmlidXRlKFwiY2xpY2stZXZlbnRcIildO1xuICAgICAgICBoYW5kbGVyICYmIGhhbmRsZXIoZXZlbnQpO1xuICAgIH1cbn0pO1xuIiwiaW1wb3J0IHsgQ1RGcmFtZXdvcmsgfSBmcm9tIFwiLi9DVEZyYW1ld29ya1wiO1xuLy8gQ29tcG9uZW50IGNsYXNzIHJlcHJlc2VudGluZyBhIFVJIGNvbXBvbmVudCB3aXRoIHN0YXRlIGFuZCBsaWZlY3ljbGUgbWFuYWdlbWVudC5cbmV4cG9ydCBjbGFzcyBDb21wb25lbnQge1xuICAgIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgICAgIHRoaXMudm5vZGUgPSBudWxsO1xuICAgICAgICB0aGlzLnByb3BzID0gcHJvcHM7XG4gICAgICAgIHRoaXMuc3RhdGUgPSB7fTtcbiAgICB9XG4gICAgLy8gU2V0IGEgbmV3IHN0YXRlIGFuZCBzY2hlZHVsZSBhIHJlLXJlbmRlciBpZiBuZWNlc3NhcnkuXG4gICAgc2V0U3RhdGUobmV3U3RhdGUpIHtcbiAgICAgICAgY29uc3QgcHJldlN0YXRlID0gdGhpcy5zdGF0ZTtcbiAgICAgICAgdGhpcy5zdGF0ZSA9IE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5zdGF0ZSksIG5ld1N0YXRlKTtcbiAgICAgICAgLy8gU2NoZWR1bGUgYSByZS1yZW5kZXIgYXN5bmNocm9ub3VzbHkuXG4gICAgICAgIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMudm5vZGUgJiYgdGhpcy5zaG91bGRDb21wb25lbnRVcGRhdGUodGhpcy5wcm9wcywgcHJldlN0YXRlKSkge1xuICAgICAgICAgICAgICAgIC8vIFVzZSBDVEZyYW1ld29yaydzIHJlcmVuZGVyIG1ldGhvZCB0byB1cGRhdGUgdGhlIERPTVxuICAgICAgICAgICAgICAgIENURnJhbWV3b3JrLnJlcmVuZGVyKHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgLy8gTWV0aG9kIHRvIGNvbnRyb2wgd2hldGhlciBhIGNvbXBvbmVudCBzaG91bGQgcmUtcmVuZGVyLlxuICAgIC8vIE92ZXJyaWRlIHRoaXMgbWV0aG9kIGluIGluZGl2aWR1YWwgY29tcG9uZW50cyBpZiBzcGVjaWZpYyBjaGVja3MgYXJlIG5lZWRlZC5cbiAgICBzaG91bGRDb21wb25lbnRVcGRhdGUobmV4dFByb3BzLCBuZXh0U3RhdGUpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7IC8vIERlZmF1bHQgYmVoYXZpb3IgaXMgdG8gYWx3YXlzIHJlLXJlbmRlci5cbiAgICB9XG4gICAgLy8gUmVuZGVyIG1ldGhvZCBtdXN0IGJlIGltcGxlbWVudGVkIGJ5IGFueSBjbGFzcyBleHRlbmRpbmcgQ29tcG9uZW50LlxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBSZW5kZXIgbWV0aG9kIG11c3QgYmUgaW1wbGVtZW50ZWQgaW4gdGhlIGNvbXBvbmVudCAke3RoaXMuY29uc3RydWN0b3IubmFtZX1gKTtcbiAgICB9XG4gICAgLy8gTGlmZWN5Y2xlIG1ldGhvZHMsIHdoaWNoIGNhbiBiZSBvdmVycmlkZGVuIGJ5IGNvbXBvbmVudHMuXG4gICAgY29tcG9uZW50T25Nb3VudCgpIHsgfVxuICAgIGNvbXBvbmVudE9uVXBkYXRlKHByZXZQcm9wcywgcHJldlN0YXRlKSB7IH1cbiAgICBjb21wb25lbnRPblVubW91bnQoKSB7IH1cbiAgICBjb21wb25lbnRPbkNhdGNoKGVycm9yLCBpbmZvKSB7IH1cbn1cbi8vIE1lbW9pemF0aW9uIGhlbHBlciBmdW5jdGlvbiBmb3IgY29tcG9uZW50cy5cbi8vIEl0IHByZXZlbnRzIHVubmVjZXNzYXJ5IHJlLXJlbmRlcnMgYnkgY2hlY2tpbmcgaWYgdGhlIHByb3BzIGhhdmUgY2hhbmdlZC5cbmV4cG9ydCBmdW5jdGlvbiBtZW1vKENvbXBvbmVudENsYXNzKSB7XG4gICAgcmV0dXJuIGNsYXNzIE1lbW9pemVkQ29tcG9uZW50IGV4dGVuZHMgQ29tcG9uZW50IHtcbiAgICAgICAgc2hvdWxkQ29tcG9uZW50VXBkYXRlKG5leHRQcm9wcykge1xuICAgICAgICAgICAgcmV0dXJuIHNoYWxsb3dDb21wYXJlKHRoaXMucHJvcHMsIG5leHRQcm9wcyk7IC8vIFVzZSBzaGFsbG93IGNvbXBhcmlzb24gb2YgcHJvcHMgdG8gcHJldmVudCByZS1yZW5kZXJpbmcuXG4gICAgICAgIH1cbiAgICAgICAgLy8gRm9yd2FyZCB0aGUgcmVuZGVyIG1ldGhvZCBmcm9tIHRoZSBvcmlnaW5hbCBjb21wb25lbnQgY2xhc3NcbiAgICAgICAgcmVuZGVyKCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBDb21wb25lbnRDbGFzcyh0aGlzLnByb3BzKS5yZW5kZXIoKTtcbiAgICAgICAgfVxuICAgIH07XG59XG4vLyBBIHNoYWxsb3cgY29tcGFyaXNvbiBmdW5jdGlvbiB0byBjaGVjayBpZiB0d28gb2JqZWN0cyBhcmUgZGlmZmVyZW50LlxuZnVuY3Rpb24gc2hhbGxvd0NvbXBhcmUob2JqMSwgb2JqMikge1xuICAgIGZvciAoY29uc3Qga2V5IGluIG9iajEpIHtcbiAgICAgICAgaWYgKG9iajFba2V5XSAhPT0gb2JqMltrZXldKVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vanN4LmQudHNcIiAvPlxuaW1wb3J0IHsgQ29tcG9uZW50LCBtZW1vIH0gZnJvbSBcIi4vQ29tcG9uZW50XCI7XG5pbXBvcnQgeyBjcmVhdGVFbGVtZW50LCBDVEZyYW1ld29yayB9IGZyb20gXCIuL0NURnJhbWV3b3JrXCI7XG5leHBvcnQgeyBDb21wb25lbnQsIG1lbW8sIGNyZWF0ZUVsZW1lbnQgfTtcbmV4cG9ydCBkZWZhdWx0IENURnJhbWV3b3JrO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9