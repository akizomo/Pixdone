import{j as e}from"./iframe-DbiBQxMl.js";import{useMDXComponents as t}from"./index-NCH00_ay.js";import{M as r}from"./blocks-pUQiorwL.js";import"./preload-helper-PPVm8Dsz.js";import"./index-DVmwhS5k.js";function i(s){const n={code:"code",h1:"h1",h2:"h2",hr:"hr",li:"li",p:"p",strong:"strong",ul:"ul",...t(),...s.components};return e.jsxs(e.Fragment,{children:[e.jsx(r,{title:"Foundations PXD/Accessibility"}),`
`,e.jsx(n.h1,{id:"accessibility",children:"Accessibility"}),`
`,e.jsxs(n.p,{children:["Pixdone foundations are built ",e.jsx(n.strong,{children:"accessible by default"}),". Apply these rules when implementing components and patterns. This page does not use token tables; it describes design and implementation rules."]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"minimum-tap-targets",children:"Minimum tap targets"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"44×44px minimum"})," for primary interactive elements: buttons, links, list rows, icon-only controls."]}),`
`,e.jsxs(n.li,{children:["Use ",e.jsx(n.code,{children:"--pxd-tap-target-min: 44px"})," and spacing tokens so touch targets are never smaller."]}),`
`,e.jsx(n.li,{children:"Provide adequate spacing between targets to avoid mis-taps."}),`
`]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"focus-visibility",children:"Focus visibility"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Visible focus states"})," – Every focusable element must show a clear focus indicator (e.g. ring using ",e.jsx(n.code,{children:"--pxd-color-focus-ring"})," and ",e.jsx(n.code,{children:"--pxd-color-focus-ring-offset"}),")."]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Never remove focus outline"})," without replacing it with an equally visible style (e.g. 2px outline or custom ring)."]}),`
`,e.jsxs(n.li,{children:["Ensure focus ring has ",e.jsx(n.strong,{children:"at least 3:1 contrast"})," against the background."]}),`
`]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"color-contrast",children:"Color contrast"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Text"})," – Meet WCAG 2.1 AA: ",e.jsx(n.strong,{children:"4.5:1"})," for normal text, ",e.jsx(n.strong,{children:"3:1"})," for large text (e.g. 24px+)."]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"UI components"})," – Non-text UI should have at least ",e.jsx(n.strong,{children:"3:1"})," contrast against adjacent surfaces."]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Do not rely on color alone"})," – Pair semantic colors (success, warning, danger) with icon or text so meaning is clear without color."]}),`
`]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"reduced-motion",children:"Reduced motion"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:[e.jsxs(n.strong,{children:["Respect ",e.jsx(n.code,{children:"prefers-reduced-motion: reduce"})]})," – ",e.jsx(n.code,{children:"tokens.css"})," shortens motion duration variables when this preference is set. Use ",e.jsx(n.code,{children:"--pxd-motion-*"})," variables for all transitions and animations."]}),`
`,e.jsx(n.li,{children:"Prefer reduced or no motion for decorative effects; keep essential feedback minimal (e.g. instant or fast only)."}),`
`]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"icon-button-labeling",children:"Icon button labeling"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Accessible labels"})," – Use ",e.jsx(n.code,{children:"aria-label"})," or visually hidden text so screen reader users understand the action."]}),`
`,e.jsx(n.li,{children:"Ensure the control is focusable and meets the minimum tap target size (44×44px)."}),`
`]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"summary-checklist",children:"Summary checklist"}),`
`,e.jsxs(n.p,{children:[`| Area | Requirement |
|------|-------------|
| Tap target | ≥ 44×44px; use `,e.jsx(n.code,{children:"--pxd-tap-target-min"}),` |
| Focus | Visible ring; never outline: none without replacement |
| Contrast | WCAG AA for text; 3:1 for UI; semantics not by color alone |
| Reduced motion | Use `,e.jsx(n.code,{children:"--pxd-motion-*"}),`; honor prefers-reduced-motion |
| Icon buttons | aria-label or equivalent; focusable |`]})]})}function h(s={}){const{wrapper:n}={...t(),...s.components};return n?e.jsx(n,{...s,children:e.jsx(i,{...s})}):i(s)}export{h as default};
