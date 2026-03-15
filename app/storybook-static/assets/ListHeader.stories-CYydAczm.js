import{r as x,j as a}from"./iframe-DbiBQxMl.js";import{p as v}from"./sound-nyVtKXjL.js";import"./preload-helper-PPVm8Dsz.js";const b={en:{addTask:"Add a task",save:"Save",cancel:"Cancel",delete:"Delete",today:"Today",tomorrow:"Tomorrow",dueToday:"Today",dueTomorrow:"Tomorrow",repeat:"Repeat",repeatNone:"None",repeatDaily:"Daily",repeatWeekly:"Weekly",repeatMonthly:"Monthly",repeatYearly:"Yearly",details:"Notes…",subtasks:"Subtasks",addSubtask:"Add subtask",completed:"Completed",rename:"Rename",deleteList:"Delete list",newList:"New list",listName:"List name",deleteConfirm:"Delete this list and all its tasks?",myTasks:"My Tasks",tutorial:"Tutorial",emptyReady:"READY?",emptyReadySub:"Press + to add your first task",emptyRest:"ALL CLEAR!",emptyRestSub:"Time to rest!",deleteTask:"Delete task",deleteTaskConfirm:"Delete this task?",date:"Date"},ja:{addTask:"タスクを追加",save:"保存",cancel:"キャンセル",delete:"削除",today:"今日",tomorrow:"明日",dueToday:"今日",dueTomorrow:"明日",repeat:"繰り返し",repeatNone:"なし",repeatDaily:"毎日",repeatWeekly:"毎週",repeatMonthly:"毎月",repeatYearly:"毎年",details:"メモ…",subtasks:"サブタスク",addSubtask:"サブタスクを追加",completed:"完了済み",rename:"名前を変更",deleteList:"リストを削除",newList:"新しいリスト",listName:"リスト名",deleteConfirm:"このリストとタスクをすべて削除しますか？",myTasks:"マイタスク",tutorial:"チュートリアル",emptyReady:"READY?",emptyReadySub:"+ を押して最初のタスクを追加",emptyRest:"ALL CLEAR!",emptyRestSub:"よく頑張った！休憩しよう",deleteTask:"タスクを削除",deleteTaskConfirm:"このタスクを削除しますか？",date:"日付"}};function T(t,r){return b[r]?.[t]??b.en?.[t]??t}function k({title:t,showMenu:r,lang:n="en",onRename:s,onDelete:h}){const[l,c]=x.useState(!1),g=x.useRef(null);return x.useEffect(()=>{if(!l)return;const e=w=>{g.current&&!g.current.contains(w.target)&&c(!1)};return document.addEventListener("mousedown",e),()=>document.removeEventListener("mousedown",e)},[l]),a.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px",marginBottom:"8px"},children:[a.jsx("h2",{style:{fontSize:"1.5rem",fontWeight:700,color:"var(--pd-color-text-primary)",margin:0,fontFamily:"var(--pd-font-brand)",imageRendering:"pixelated",letterSpacing:"1px",textTransform:"uppercase",textShadow:"1px 1px 0px var(--pd-color-shadow-default)"},children:t}),r&&a.jsxs("div",{ref:g,style:{position:"relative"},children:[a.jsx("button",{type:"button",onClick:()=>{v("buttonClick"),c(e=>!e)},"aria-label":"List options","aria-expanded":l,style:{width:"28px",height:"28px",border:"none",borderRadius:0,background:"transparent",color:"var(--pd-color-text-secondary)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.75rem",imageRendering:"pixelated",transition:"color 0.2s ease"},onMouseEnter:e=>{e.currentTarget.style.color="var(--pd-color-text-primary)"},onMouseLeave:e=>{e.currentTarget.style.color="var(--pd-color-text-secondary)"},children:a.jsx("span",{className:"material-icons",style:{fontSize:"20px",lineHeight:1},children:"more_vert"})}),l&&a.jsxs("div",{style:{position:"absolute",top:"110%",right:0,zIndex:200,background:"var(--pd-color-background-elevated)",border:"2px solid var(--pd-color-border-default)",boxShadow:"3px 3px 0 var(--pd-color-shadow-default)",minWidth:"150px"},children:[s&&a.jsxs("button",{type:"button",onClick:()=>{v("buttonClick"),c(!1),s()},style:{display:"block",width:"100%",textAlign:"left",padding:"10px 14px",background:"none",border:"none",borderBottom:"1px solid var(--pd-color-border-default)",color:"var(--pd-color-text-primary)",fontFamily:"var(--pd-font-body)",fontSize:"0.875rem",cursor:"pointer"},onMouseEnter:e=>{e.currentTarget.style.background="var(--pd-color-background-hover)"},onMouseLeave:e=>{e.currentTarget.style.background="none"},children:[a.jsx("span",{className:"material-icons",style:{fontSize:"16px",lineHeight:1,verticalAlign:"middle",marginRight:"6px"},children:"edit"}),T("rename",n)]}),h&&a.jsxs("button",{type:"button",onClick:()=>{v("buttonClick"),c(!1),h()},style:{display:"block",width:"100%",textAlign:"left",padding:"10px 14px",background:"none",border:"none",color:"var(--pd-color-semantic-danger, #ef4444)",fontFamily:"var(--pd-font-body)",fontSize:"0.875rem",cursor:"pointer"},onMouseEnter:e=>{e.currentTarget.style.background="var(--pd-color-background-hover)"},onMouseLeave:e=>{e.currentTarget.style.background="none"},children:[a.jsx("span",{className:"material-icons",style:{fontSize:"16px",lineHeight:1,verticalAlign:"middle",marginRight:"6px"},children:"delete"}),T("deleteList",n)]})]})]})]})}k.__docgenInfo={description:"",methods:[],displayName:"ListHeader",props:{title:{required:!0,tsType:{name:"string"},description:""},showMenu:{required:!0,tsType:{name:"boolean"},description:""},lang:{required:!1,tsType:{name:"union",raw:"'en' | 'ja'",elements:[{name:"literal",value:"'en'"},{name:"literal",value:"'ja'"}]},description:"",defaultValue:{value:"'en'",computed:!1}},onRename:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""},onDelete:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""}}};const{fn:i,userEvent:y,within:f,expect:o}=__STORYBOOK_MODULE_TEST__,M={title:"PixDone/App/ListHeader",component:k,tags:["autodocs"],argTypes:{title:{control:"text"},showMenu:{control:"boolean"}},args:{onRename:i(),onDelete:i()}},d={args:{title:"My Tasks",showMenu:!1},play:async({canvasElement:t})=>{const r=f(t);o(r.getByText("My Tasks")).toBeTruthy();const n=t.querySelector('[aria-label="List options"]');o(n).toBeNull()}},u={args:{title:"Shopping",showMenu:!0,onRename:i(),onDelete:i()},play:async({canvasElement:t,args:r})=>{const n=f(t),s=n.getByLabelText("List options");o(s.getAttribute("aria-expanded")).toBe("false"),await y.click(s),o(s.getAttribute("aria-expanded")).toBe("true"),o(n.getByText(/Rename/i)).toBeTruthy(),o(n.getByText(/Delete/i)).toBeTruthy(),await y.click(n.getByText(/Rename/i)),o(r.onRename).toHaveBeenCalledOnce()}},p={args:{title:"💥 Smash List",showMenu:!1}},m={args:{title:"Work",showMenu:!0,onRename:i(),onDelete:i()},play:async({canvasElement:t,args:r})=>{const n=f(t);await y.click(n.getByLabelText("List options")),await y.click(n.getByText(/Delete/i)),o(r.onDelete).toHaveBeenCalledOnce()}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    title: 'My Tasks',
    showMenu: false
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText('My Tasks')).toBeTruthy();
    // No menu button when showMenu=false
    const menuBtn = canvasElement.querySelector('[aria-label="List options"]');
    expect(menuBtn).toBeNull();
  }
}`,...d.parameters?.docs?.source}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    title: 'Shopping',
    showMenu: true,
    onRename: fn(),
    onDelete: fn()
  },
  play: async ({
    canvasElement,
    args
  }) => {
    const canvas = within(canvasElement);
    const menuBtn = canvas.getByLabelText('List options');
    // Menu is initially closed
    expect(menuBtn.getAttribute('aria-expanded')).toBe('false');
    // Open menu
    await userEvent.click(menuBtn);
    expect(menuBtn.getAttribute('aria-expanded')).toBe('true');
    // Rename and Delete items are visible
    expect(canvas.getByText(/Rename/i)).toBeTruthy();
    expect(canvas.getByText(/Delete/i)).toBeTruthy();
    // Click rename
    await userEvent.click(canvas.getByText(/Rename/i));
    expect(args.onRename).toHaveBeenCalledOnce();
  }
}`,...u.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    title: '💥 Smash List',
    showMenu: false
  }
}`,...p.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    title: 'Work',
    showMenu: true,
    onRename: fn(),
    onDelete: fn()
  },
  play: async ({
    canvasElement,
    args
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByLabelText('List options'));
    await userEvent.click(canvas.getByText(/Delete/i));
    expect(args.onDelete).toHaveBeenCalledOnce();
  }
}`,...m.parameters?.docs?.source}}};const S=["MyTasks","WithMenu","SmashList","DeleteFromMenu"];export{m as DeleteFromMenu,d as MyTasks,p as SmashList,u as WithMenu,S as __namedExportsOrder,M as default};
