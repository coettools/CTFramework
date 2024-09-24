/// <reference path="./jsx.d.ts" />

import { Component, memo } from "./Component";
import { createElement, CTFramework } from "./CTFramework";
import { VNode } from "./types";

// Exporting types and components
export type { VNode };
export { Component, memo, createElement };
export default CTFramework;
